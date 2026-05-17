import { useEffect, useState } from "react";
import { Platform } from "react-native";
import AppleHealthKit, { HealthKitPermissions } from "react-native-health";

export const useHealthData = () => {
  const [healthData, setHealthData] = useState({
    steps: 0,
    heartRate: 0,
    walkingDistance: 0,
  });

  useEffect(() => {
    if (Platform.OS !== "ios") return; // HealthKit only

    const permissions: HealthKitPermissions = {
      permissions: {
        read: ["StepCount", "HeartRate", "DistanceWalkingRunning"],
        write: ["StepCount"], // if you want to write
      },
    };

    AppleHealthKit.initHealthKit(permissions, (err: string) => {
      if (err) {
        console.log("❌ HealthKit initialization error:", err);
        return;
      }

      const today = new Date().toISOString();

      // Fetch Steps
      AppleHealthKit.getStepCount({ date: today }, (err, result) => {
        if (result?.value) setHealthData((prev) => ({ ...prev, steps: result.value }));
      });

      // Fetch Heart Rate
      AppleHealthKit.getHeartRateSamples({ startDate: today }, (err, results) => {
        if (results?.length) {
          setHealthData((prev) => ({
            ...prev,
            heartRate: results[results.length - 1].value,
          }));
        }
      });

      // Fetch Walking/Running Distance
      AppleHealthKit.getDistanceWalkingRunning({ date: today }, (err, result) => {
        if (result?.value) setHealthData((prev) => ({ ...prev, walkingDistance: result.value }));
      });

      // Optional: subscribe to live updates
      AppleHealthKit.observeStepCount((res) => {
        setHealthData((prev) => ({ ...prev, steps: res.value }));
      });

      AppleHealthKit.observeHeartRate((res) => {
        setHealthData((prev) => ({ ...prev, heartRate: res.value }));
      });
    });
  }, []);

  return healthData;
};
