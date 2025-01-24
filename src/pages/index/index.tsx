import Taro from "@tarojs/taro";
import { View, Text, Input, Picker } from "@tarojs/components";
import { useState, useEffect, useCallback } from "react";
import { pinyin } from "pinyin-pro";
import { debounce } from "@/utils";
import emojis from "./emojis.json";
import "./index.scss";

const pinyinCache = {};

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [displayEmojis, setDisplayEmojis] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [isLoading, setIsLoading] = useState(true);
  const [isWeapp, setIsWeapp] = useState(false); // 是否是小程序环境

  // 分类列表
  const categories = ["全部", ...Object.keys(emojis)];

  // 初始化主题和设备宽度
  useEffect(() => {
    const savedTheme = Taro.getStorageSync("theme") || "dark";
    setTheme(savedTheme);
    Taro.setNavigationBarColor({
      frontColor: savedTheme === "dark" ? "#ffffff" : "#000000",
      backgroundColor: savedTheme === "dark" ? "#1e1e1e" : "#ffffff",
    });

    // 检测是否是小程序环境
    setIsWeapp(Taro.getEnv() === Taro.ENV_TYPE.WEAPP);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    Taro.setStorageSync("theme", newTheme);
    Taro.setNavigationBarColor({
      frontColor: newTheme === "dark" ? "#ffffff" : "#000000",
      backgroundColor: newTheme === "dark" ? "#1e1e1e" : "#ffffff",
    });
  };

  // 处理分类选择
  const handleCategoryChange = (e) => {
    const category = categories[e.detail.value];
    setSelectedCategory(category);
    setSearchKeyword(""); // 清空搜索框
  };

  // 处理分类点击（宽屏设备）
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchKeyword(""); // 清空搜索框
  };

  // 实时更新输入框的值
  const handleSearchInput = (e) => {
    const keyword = e.detail.value;
    setSearchKeyword(keyword);
  };

  // 防抖后的搜索逻辑
  const performSearch = useCallback(
    debounce((keyword) => {
      let emojiList = [];

      if (selectedCategory === "全部") {
        emojiList = Object.values(emojis).flat();
      } else {
        emojiList = emojis[selectedCategory];
      }

      if (keyword) {
        const filteredEmojis = emojiList.filter((item) => {
          const matchChinese = item.keywords.some((kw) => kw.includes(keyword));
          const matchPinyin = item.keywords.some((kw) => {
            const { fullPinyin, initials } = getPinyin(kw);
            return (
              fullPinyin.toLowerCase().includes(keyword.toLowerCase()) ||
              initials.toLowerCase().includes(keyword.toLowerCase())
            );
          });
          return matchChinese || matchPinyin;
        });

        setDisplayEmojis(filteredEmojis);
      } else {
        setDisplayEmojis(emojiList);
      }

      setIsLoading(false);
    }, 300),
    [selectedCategory]
  );

  // 监听 searchKeyword 的变化，触发防抖搜索
  useEffect(() => {
    setIsLoading(true);
    performSearch(searchKeyword);
  }, [searchKeyword, performSearch]);

  // 复制 Emoji 到剪贴板
  const handleCopyEmoji = (emoji) => {
    Taro.setClipboardData({
      data: emoji,
      success: () => {
        Taro.showToast({ title: "已复制", icon: "success" });
      },
      fail: () => {
        Taro.showToast({ title: "复制失败", icon: "none" });
      },
    });
  };

  // 将中文关键字转换为拼音
  const getPinyin = (keyword) => {
    if (pinyinCache[keyword]) {
      return pinyinCache[keyword];
    }

    const fullPinyin = pinyin(keyword, {
      toneType: "none",
      type: "array",
    }).join("");
    const initials = pinyin(keyword, { pattern: "first", type: "array" }).join(
      ""
    );

    pinyinCache[keyword] = { fullPinyin, initials };
    return { fullPinyin, initials };
  };

  return (
    <View className={`container ${theme}`}>
      <View className="header">
        <View className="title" style={isWeapp ? { fontSize: "48rpx" } : {}}>
          Emoji查找神器
        </View>
        <View className="subtitle" style={isWeapp ? { fontSize: "28rpx" } : {}}>
          快速查找 Emoji，点击即可复制
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="search-bar">
        {isWeapp ? (
          <Picker
            mode="selector"
            range={categories}
            onChange={handleCategoryChange}
            value={categories.indexOf(selectedCategory)}
          >
            <View className="category-picker">
              <Text>{selectedCategory}</Text>
            </View>
          </Picker>
        ) : null}
        <Input
          className="search-input"
          placeholder="搜索 Emoji（支持中文、拼音或首字母）"
          value={searchKeyword}
          onInput={handleSearchInput}
        />
      </View>

      {/* 内容区域 */}
      <View className="content">
        {/* 分类列表栏（宽屏设备） */}
        {!isWeapp && (
          <View className="category-list">
            <Text className="category-title">分类</Text>
            <View className="categories">
              {categories.map((category) => (
                <View
                  key={category}
                  className={`category-item ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <Text>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emoji 列表 */}
        <View className="emoji-list">
          <Text className="emoji-title">
            {searchKeyword ? "搜索结果" : selectedCategory}
          </Text>
          <View className="emojis">
            {isLoading ? (
              <View className="loading">
                <View className="dot" />
                <View className="dot" />
                <View className="dot" />
              </View>
            ) : (
              displayEmojis.map((item, index) => (
                <View key={index} className="emoji-item">
                  <Text
                    className="emoji"
                    onClick={() => handleCopyEmoji(item.emoji)}
                  >
                    {item.emoji}
                  </Text>
                  <Text className="emoji-keywords">
                    {item.keywords.join(", ")}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>

      {/* 悬浮按钮 */}
      <View
        className="theme-toggle"
        onClick={toggleTheme}
        style={{ minHeight: "60PX", minWidth: "60PX" }}
      >
        🌓
      </View>
    </View>
  );
};

export default Index;
