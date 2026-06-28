import type { ChannelActivity } from "@sempt/shared";

export const demoChannels: ChannelActivity[] = [
  { channelId: "1", name: "#질문", messageCount7d: 342, activeUsers7d: 48 },
  { channelId: "2", name: "#일반", messageCount7d: 288, activeUsers7d: 56 },
  { channelId: "3", name: "#이벤트", messageCount7d: 42, activeUsers7d: 15 },
  { channelId: "4", name: "#자료", messageCount7d: 2, activeUsers7d: 2 }
];

export const demoMembers = [
  { userId: "9012", activityScore: 82, reputationScore: 76, trustScore: 80, recent: "오늘" },
  { userId: "7344", activityScore: 43, reputationScore: 58, trustScore: 55, recent: "3일 전" },
  { userId: "1207", activityScore: 18, reputationScore: 38, trustScore: 34, recent: "14일 전" }
];
