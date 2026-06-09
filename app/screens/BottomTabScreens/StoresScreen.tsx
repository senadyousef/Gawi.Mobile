import * as React from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  View,
  RefreshControl,
  TouchableOpacity,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  useNavigation,
  useScrollToTop,
  NavigationProp,
} from "@react-navigation/native";
import { RootStackParamList, Istore, IshopItem } from "../../types";
import i18n from "../../localization";
import { width, API_BASE_ENDPOINT } from "../../constants";
import { useAppContext } from "../../context";
import { defaultErrorToast } from "../../helpers";
import SearchBar from "../../components/ShopScreen/SearchBar";
import StoreCard from "../../components/StoreScreen/StoreCard";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { ListEmptyComponent } from "../../components/ListEmptyComponent";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#FFFFFF",
});

const StoresScreen = () => {
  const ref = React.useRef(null);
  useScrollToTop(ref);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { guestMode, isDarkMode } = useAppContext(); // 👈 pull isDarkMode

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles
  const [categories, setCategories] = React.useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<number>(-1);

  const [allShopItems, setAllShopItems] = React.useState<Istore[]>([]);
  const [shopItems, setShopItems] = React.useState<Istore[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout>();
  const isRTL = i18n.locale === "ar";
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_BASE_ENDPOINT}/Category/getallCategory`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) return;

      const result = await response.json();

      console.log("Categories API:", result);

      setCategories(Array.isArray(result?.result) ? result.result : []);
    } catch (error) {
      console.log("Category Error", error);
    }
  };
  const fetchShopItems = async (searchText?: string) => {
    try {
      setIsLoading(true);
      const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
      const url = `${API_BASE_ENDPOINT}/Gyms/getAllGymsStoreItems?userId=${MemberId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401) {
        defaultErrorToast(i18n.t("unauthorized_access"));
        return [];
      }
      if (!response.ok) {
        defaultErrorToast(i18n.t("an_error_occured"));
        return [];
      }

      const result = await response.json();
      console.log("Fetched stores:", result);
      const stores = Array.isArray(result) ? result : [];
      const filtered =
        searchText && searchText.trim().length > 0
          ? stores.filter((item) =>
              (i18n.locale === "en" ? item.nameEn : item.nameAr)
                ?.toLowerCase()
                .includes(searchText.toLowerCase()),
            )
          : stores;

      setAllShopItems(stores);
      setShopItems(filtered);
    } catch (error) {
      console.error("❌ Error fetching stores:", error);
      defaultErrorToast(i18n.t("an_error_occured"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  const handleCategoryPress = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);

    let filtered = [...allShopItems];

    if (categoryId !== -1) {
      filtered = filtered.filter(
        (item) => Number(item.categoryId) === Number(categoryId),
      );
    }

    if (searchValue.trim()) {
      filtered = filtered.filter((item) =>
        (i18n.locale === "ar" ? item.nameAr : item.nameEn)
          ?.toLowerCase()
          .includes(searchValue.toLowerCase()),
      );
    }

    setShopItems(filtered);
  };
  React.useEffect(() => {
    fetchShopItems();
    fetchCategories();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchShopItems(searchValue);
  };

  const onSearchTextChanged = (value?: string) => {
    clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setSearchValue(value || "");
        fetchShopItems(value);
      }, 500),
    );
  };

  const handleNavigate = (e: IshopItem) => {
    navigation.navigate("productDetails", {
      productId: e.id,
      isGymStore: false,
    });
  };

  return (
    <View style={s.container}>
      <SearchBar
        onSearchTextChanged={onSearchTextChanged}
        isDarkMode={isDarkMode} // 👈 pass down if SearchBar has its own colors
      />
      {isLoading && !shopItems.length && (
        <LoadingIndicator isLoading={isLoading} />
      )}
      <View style={{ height: 50 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              id: -1,
              categoryNameEn: "All",
              categoryNameAr: "الكل",
            },
            ...(Array.isArray(categories) ? categories : []),
          ]}
          keyExtractor={(item, index) => item.id?.toString() || `all-${index}`}
          contentContainerStyle={{
            paddingVertical: 10,
          }}
          renderItem={({ item }) => {
            const selected = selectedCategoryId === item.id;

            return (
              <TouchableOpacity
                onPress={() => handleCategoryPress(item.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 10,
                  backgroundColor: selected
                    ? "#4F46E5"
                    : isDarkMode
                      ? "#222"
                      : "#F2F2F2",
                }}
              >
                <Text
                  style={{
                    color: selected ? "#FFF" : isDarkMode ? "#FFF" : "#000",
                  }}
                >
                  {i18n.locale === "ar"
                    ? item.categoryNameAr || item.nameAr
                    : item.categoryNameEn || item.nameEn}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      <FlatList
        ref={ref}
        numColumns={2}
        data={shopItems}
        contentContainerStyle={s.contentContainerStyle}
        columnWrapperStyle={{
          flexDirection: isRTL ? "row-reverse" : "row",
          justifyContent: "space-between",
        }}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? "#F0F0F0" : "#1A1A1A"}
            colors={[isDarkMode ? "#F0F0F0" : "#1A1A1A"]}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isLoading}
            message={String(i18n.t("no_stores_found"))}
          />
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              flex: 1,
              marginBottom: 15,
              marginRight: !isRTL && index % 2 === 0 ? 15 : 0,
              marginLeft: isRTL && index % 2 === 0 ? 15 : 0,
            }}
          >
            <StoreCard
              item={item}
              onPress={() => handleNavigate(item)}
              isDarkMode={isDarkMode}
            />
          </View>
        )}
      />
      <StatusBar style={isDarkMode ? "light" : "dark"} /> {/* 👈 */}
    </View>
  );
};

export default StoresScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: 15,
      padding: 16,
      backgroundColor: theme.bg, // 👈
    },
    contentContainerStyle: {
      width: width - 32,
      paddingVertical: 5,
      paddingBottom: 25,
    },
  });
