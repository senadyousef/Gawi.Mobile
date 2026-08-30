import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleGetToken } from "../helpers";

const HUB_URL = "http://192.168.1.16/Hub/Gym";

export interface GymNotification {
  memberId: number;
  gymId: number;
  isInGym: boolean;
  message?: string;
}

class GymHub {
  connection: signalR.HubConnection | null = null;
  private startPromise: Promise<signalR.HubConnection> | null = null; // dedupes concurrent start() calls from both screens
  private currentGymId: number | null = null;

  // 👇 maps each original handler -> the wrapped fn actually registered on
  // the connection, per event, so off() can remove the exact same reference
  // SignalR requires. Without this, off() was a silent no-op and every
  // remount stacked another listener on top of the old one.
  private handlerMap = new Map<
    string,
    Map<(...args: any[]) => void, (...args: any[]) => void>
  >();

  private buildConnection() {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // fetch a fresh token every time SignalR needs one (negotiate,
        // reconnect) instead of capturing one stale token forever
        accessTokenFactory: async () => (await handleGetToken()) || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onreconnecting((err) => {
      console.log("🔄 [gymHub] reconnecting...", err?.message);
    });

    connection.onreconnected(async (connectionId) => {
      console.log("✅ [gymHub] reconnected, connectionId:", connectionId);
      const gymId =
        this.currentGymId ?? Number(await AsyncStorage.getItem("GymId"));
      if (gymId) {
        try {
          await connection.invoke("JoinGym", gymId);
          console.log(`👥 [gymHub] rejoined gym-${gymId} after reconnect`);
        } catch (err) {
          console.error("❌ [gymHub] rejoin after reconnect failed:", err);
        }
      }
    });

    connection.onclose((err) => {
      console.log("❌ [gymHub] connection closed:", err?.message);
    });

    return connection;
  }

  async start(): Promise<signalR.HubConnection> {
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      console.log("ℹ️ [gymHub] start() called, already connected");

      // 👇 in case we connected earlier but GymId wasn't in storage yet,
      // retry the join on every subsequent start() call from a screen
      if (!this.currentGymId) {
        const gymId = await AsyncStorage.getItem("GymId");
        if (gymId) {
          await this.joinGroup(Number(gymId));
        }
      }

      return this.connection;
    }

    if (this.startPromise) {
      console.log("ℹ️ [gymHub] start() called, awaiting in-flight start");
      return this.startPromise;
    }

    this.startPromise = (async () => {
      if (!this.connection) {
        this.connection = this.buildConnection();
      }

      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        console.log("▶️ [gymHub] starting connection to", HUB_URL);
        await this.connection.start();
        console.log(
          "✅ [gymHub] connected, state:",
          this.connection.state,
        );
      }

      const gymId = await AsyncStorage.getItem("GymId");
      if (gymId) {
        await this.joinGroup(Number(gymId));
      } else {
        console.log("⚠️ [gymHub] no GymId in storage yet, nothing to join");
      }

      return this.connection;
    })();

    try {
      return await this.startPromise;
    } catch (err) {
      console.error("❌ [gymHub] start() failed:", err);
      throw err;
    } finally {
      this.startPromise = null;
    }
  }

  async joinGroup(gymId: number) {
    this.currentGymId = gymId;

    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.log(
        `⏳ [gymHub] joinGroup(${gymId}) called before connected — starting first`,
      );
      await this.start();
    }

    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    ) {
      console.error(
        `❌ [gymHub] joinGroup(${gymId}) still not connected, giving up`,
      );
      return;
    }

    try {
      await this.connection.invoke("JoinGym", gymId);
      console.log(`👥 [gymHub] joined gym-${gymId}`);
    } catch (err) {
      console.error(`❌ [gymHub] JoinGym(${gymId}) invoke failed:`, err);
      throw err;
    }
  }

  async leaveGroup(gymId: number) {
    if (
      !this.connection ||
      this.connection.state !== signalR.HubConnectionState.Connected
    )
      return;
    try {
      await this.connection.invoke("LeaveGym", gymId);
      console.log(`👋 [gymHub] left gym-${gymId}`);
    } catch (err) {
      console.error("Error leaving gym group:", err);
    }
  }

  on(event: string, handler: (...args: any[]) => void) {
    console.log(`📌 [gymHub] on("${event}") registered`);

    const wrapped = (...args: any[]) => {
      console.log(`🔔 [gymHub] "${event}" received:`, args);
      handler(...args);
    };

    if (!this.handlerMap.has(event)) {
      this.handlerMap.set(event, new Map());
    }
    this.handlerMap.get(event)!.set(handler, wrapped);

    this.connection?.on(event, wrapped);
  }

  off(event: string, handler: (...args: any[]) => void) {
    const wrapped = this.handlerMap.get(event)?.get(handler);
    if (wrapped) {
      this.connection?.off(event, wrapped);
      this.handlerMap.get(event)!.delete(handler);
    }
  }

  // 👇 fires all locally-registered listeners for this event immediately,
  // without waiting for the server to push it back over the socket. Use
  // this right after an action the current device already knows succeeded
  // (like a check-in/out) so this device's own screens update instantly.
  emitLocal(event: string, ...args: any[]) {
    const handlers = this.handlerMap.get(event);
    if (!handlers || handlers.size === 0) {
      console.log(`ℹ️ [gymHub] emitLocal("${event}") — no listeners registered`);
      return;
    }
    console.log(`📣 [gymHub] emitLocal("${event}")`, args);
    handlers.forEach((wrapped) => wrapped(...args));
  }

  async stop() {
    if (!this.connection) return;

    const gymId = await AsyncStorage.getItem("GymId");
    if (gymId) {
      await this.leaveGroup(Number(gymId));
    }

    await this.connection.stop();
    this.connection = null; // call this on logout, not on screen unmount
    this.currentGymId = null;
    this.handlerMap.clear();
  }
}

export default new GymHub();