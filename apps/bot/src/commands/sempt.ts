import { SlashCommandBuilder } from "discord.js";

export const semptCommand = new SlashCommandBuilder()
  .setName("sempt")
  .setDescription("Sempt 서버 운영 분석 명령어")
  .addSubcommand((subcommand) => subcommand.setName("scan").setDescription("현재 서버 상태를 분석합니다."))
  .addSubcommand((subcommand) => subcommand.setName("report").setDescription("서버 건강 리포트를 생성합니다."))
  .addSubcommand((subcommand) =>
    subcommand
      .setName("member")
      .setDescription("유저의 활동/평판/신뢰도 정보를 확인합니다.")
      .addUserOption((option) => option.setName("user").setDescription("확인할 유저").setRequired(false))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("recommend")
      .setDescription("특정 유저에게 긍정 평판을 부여합니다.")
      .addUserOption((option) => option.setName("user").setDescription("추천할 유저").setRequired(true))
      .addStringOption((option) => option.setName("reason").setDescription("추천 사유").setRequired(true).setMaxLength(300))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("warn")
      .setDescription("관리자 경고를 기록합니다.")
      .addUserOption((option) => option.setName("user").setDescription("경고 대상").setRequired(true))
      .addStringOption((option) => option.setName("reason").setDescription("경고 사유").setRequired(true).setMaxLength(300))
  )
  .addSubcommand((subcommand) => subcommand.setName("dashboard").setDescription("웹 대시보드 링크를 표시합니다."))
  .addSubcommand((subcommand) => subcommand.setName("settings").setDescription("서버 설정 요약을 표시합니다."))
  .addSubcommand((subcommand) => subcommand.setName("ai-status").setDescription("AI Provider 상태를 확인합니다."));
