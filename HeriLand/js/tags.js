<!-- tags.js -->

(function(){
  const HL = (window.HL = window.HL || {});

  // 主題 / 屬性
  const TAGS = {
    topic: [
      { id: "culture",   label: "文化" },
      { id: "food",      label: "美食" },
      { id: "nature",    label: "自然" },
      { id: "family",    label: "親子" },
      { id: "nightlife", label: "夜生活" },
      { id: "shopping",  label: "購物" },
      { id: "local",     label: "在地人愛" },
      { id: "hidden",    label: "冷門寶藏" },
    ],
    attribute: [
      { id: "halal",      label: "清真" },
      { id: "vegan",      label: "素食" },
      { id: "wheelchair", label: "輪椅友善" },
      { id: "pet",        label: "寵物友善" },
      { id: "english",    label: "英文可" },
      { id: "rainy",      label: "雨天可玩" },
      { id: "free",       label: "免費" },
    ],
  };

  // 方便用 id → label
  const TAG_MAP = new Map(
    [...TAGS.topic, ...TAGS.attribute].map(t => [t.id, t.label])
  );

  HL.TAGS = TAGS;
  HL.TAG_MAP = TAG_MAP;
})();
