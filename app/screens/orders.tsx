import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleGetToken } from "../helpers";

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const getOrderStatus = (item: any) => {
    if (item.isCancelled) return "Cancelled";
    if (item.isCompleted) return "Completed";
    if (item.isPaid) return "Paid";
    return "Pending";
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await handleGetToken();
      const userId = await AsyncStorage.getItem("MemberId");

      if (!userId) {
        throw new Error("No user id found");
      }

      const res = await fetch(
        `https://gawifit.com/api/Orders/my-orders?userId=${userId}`,
        {
          method: "GET",
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await res.json();
      console.log("Fetched orders:", data);
      setOrders(data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderTitle}>
        Order #{item.id} - {item.totalAmount} JOD
      </Text>
      <Image source={{ uri: `https://gawifit.com/${item.photoUrl}` }} />
      <Text style={styles.itemName}>Status: {item.Status}</Text>
      <Text style={styles.itemName}>Name: {item.fullName}</Text>
      <Text style={styles.itemName}>Phone: {item.phone}</Text>
      <Text style={styles.itemName}>Location: {item.location}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order: any) => order.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 3,
  },
  orderTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  itemName: {
    marginTop: 2,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#888",
  },
});
