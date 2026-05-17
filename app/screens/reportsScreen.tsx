import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import CustomHeader from "../components/CustomHeader";
import i18n from "../localization";
import Colors from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";

export default function ReportsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
   

      {/* ✅ Page Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          {i18n.t("reports_overview") || "Reports Overview"}
        </Text>
        <Text style={styles.paragraph}>
          {i18n.t("reports_description") ||
            "Here you can view and analyze your activity, schedules, and performance summaries. Detailed analytics and summaries will appear here soon."}
        </Text>

        {/* Example content area */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {i18n.t("monthly_report") || "Monthly Activity Report"}
          </Text>
          <Text style={styles.cardText}>
            {i18n.t("report_placeholder") ||
              "No data available yet. Reports will be generated once activity is recorded."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: "#666",
  },
});
