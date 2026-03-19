
/**
 * Health domain events.
 *
 * These are emitted when significant health events are detected.
 * Other domain agents (work, wallet) can subscribe to react accordingly.
 */
// export const healthEvents = {
//   poorSleep: (data: {
//     hours: number;
//     date: string;
//   }) => eventBus.emit("health", "sleep.poor_quality", data),
//
//   goodSleep: (data: {
//     hours: number;
//     date: string;
//   }) => eventBus.emit("health", "sleep.good_quality", data),
//
//   medicationMissed: (data: {
//     medicationId: string;
//     medicationName: string;
//     scheduledTime: string;
//   }) => eventBus.emit("health", "medication.missed", data),
//
//   weightSignificantChange: (data: {
//     currentWeight: string;
//     previousWeight: string;
//     changeKg: number;
//     period: string;
//   }) => eventBus.emit("health", "weight.significant_change", data),
//
//   habitStreakBroken: (data: {
//     habitId: string;
//     habitName: string;
//     streakDays: number;
//   }) => eventBus.emit("health", "habit.streak_broken", data),
//
//   habitStreakMilestone: (data: {
//     habitId: string;
//     habitName: string;
//     streakDays: number;
//   }) => eventBus.emit("health", "habit.streak_milestone", data),
//
//   moodDeclining: (data: {
//     currentMood: number;
//     averageMood: number;
//     trendDays: number;
//   }) => eventBus.emit("health", "mood.declining_trend", data),
//
//   stepsGoalReached: (data: {
//     steps: number;
//     goal: number;
//     date: string;
//   }) => eventBus.emit("health", "steps.goal_reached", data),
//
//   appointmentReminder: (data: {
//     appointmentId: string;
//     title: string;
//     scheduledAt: string;
//     daysUntil: number;
//   }) => eventBus.emit("health", "appointment.reminder", data),
// };
