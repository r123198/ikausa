import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, T } from '@/constants/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const TIME_PRESETS = ['11:59 PM', '2:00 AM', '6:00 PM', '10:00 PM'];

export default function FinishTimeScreen() {
  const router = useRouter();

  // Current real-world date
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Next year limit (allow navigation until December of next year)
  const maxYear = currentYear + 1;
  const maxMonth = 11;

  // Viewing month/year in calendar
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonth);

  // Selected date
  const [selectedDate, setSelectedDate] = useState({
    year: currentYear,
    month: currentMonth,
    day: currentDay,
  });

  // Selected time
  const [hour, setHour] = useState('11');
  const [minute, setMinute] = useState('59');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');

  // Modals
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Temp state for time editor modal
  const [tempHour, setTempHour] = useState('11');
  const [tempMinute, setTempMinute] = useState('59');
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');

  // Month navigation boundaries
  const canGoPrev =
    viewYear > currentYear ||
    (viewYear === currentYear && viewMonth > currentMonth);
  const canGoNext =
    viewYear < maxYear ||
    (viewYear === maxYear && viewMonth < maxMonth);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar grid for viewYear & viewMonth
  const weeks = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const result: number[][] = [];
    let currentWeek: number[] = [];

    // Fill leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      currentWeek.push(0);
    }

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill trailing empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(0);
      }
      result.push(currentWeek);
    }

    return result;
  }, [viewYear, viewMonth]);

  // List of selectable months up to next year
  const availableMonths = useMemo(() => {
    const list: { year: number; month: number; label: string }[] = [];
    let y = currentYear;
    let m = currentMonth;
    while (y < maxYear || (y === maxYear && m <= maxMonth)) {
      list.push({
        year: y,
        month: m,
        label: `${MONTH_NAMES[m]} ${y}`,
      });
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return list;
  }, [currentYear, currentMonth, maxYear, maxMonth]);

  const formattedTime = `${parseInt(hour, 10) || 12}:${(parseInt(minute, 10) || 0)
    .toString()
    .padStart(2, '0')} ${period}`;

  // Time modal open handler
  const openTimeModal = () => {
    setTempHour(hour);
    setTempMinute(minute.padStart(2, '0'));
    setTempPeriod(period);
    setShowTimeModal(true);
  };

  // Save edited time
  const handleSaveTime = () => {
    let h = parseInt(tempHour, 10);
    if (isNaN(h) || h < 1) h = 12;
    if (h > 12) h = 12;

    let m = parseInt(tempMinute, 10);
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;

    setHour(h.toString());
    setMinute(m.toString().padStart(2, '0'));
    setPeriod(tempPeriod);
    setShowTimeModal(false);
  };

  // Apply preset time directly
  const applyPreset = (presetStr: string) => {
    const [timePart, p] = presetStr.split(' ');
    const [h, m] = timePart.split(':');
    setHour(h);
    setMinute(m);
    setPeriod(p as 'AM' | 'PM');
  };

  // Steppers for modal time editor
  const adjustTempHour = (delta: number) => {
    let h = (parseInt(tempHour, 10) || 12) + delta;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    setTempHour(h.toString());
  };

  const adjustTempMinute = (delta: number) => {
    let m = (parseInt(tempMinute, 10) || 0) + delta;
    if (m >= 60) m = 0;
    if (m < 0) m = 55;
    setTempMinute(m.toString().padStart(2, '0'));
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Bare back button */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>When does your{'\n'}event finish?</Text>
        <Text style={styles.subtext}>
          The film opens now, and guests can capture photos until the film closes
          at your chosen time.
        </Text>

        <View style={styles.calendarWrap}>
          {/* Bare Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable
              style={[styles.monthNavBtn, !canGoPrev && styles.monthNavBtnDisabled]}
              onPress={handlePrevMonth}
              disabled={!canGoPrev}>
              <Text
                style={[
                  styles.monthNavArrow,
                  !canGoPrev && styles.monthNavArrowDisabled,
                ]}>
                ←
              </Text>
            </Pressable>

            <Pressable
              style={styles.monthLabelBtn}
              onPress={() => setShowMonthModal(true)}>
              <Text style={styles.monthLabel}>
                {MONTH_SHORT[viewMonth]} {viewYear}
              </Text>
              <Text style={styles.monthChevron}>▾</Text>
            </Pressable>

            <Pressable
              style={[styles.monthNavBtn, !canGoNext && styles.monthNavBtnDisabled]}
              onPress={handleNextMonth}
              disabled={!canGoNext}>
              <Text
                style={[
                  styles.monthNavArrow,
                  !canGoNext && styles.monthNavArrowDisabled,
                ]}>
                →
              </Text>
            </Pressable>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.daysHeader}>
            {DAYS.map((d) => (
              <View key={d} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Weeks Grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (day === 0) {
                  return <View key={di} style={styles.dayCell} />;
                }

                const isPast =
                  viewYear < currentYear ||
                  (viewYear === currentYear && viewMonth < currentMonth) ||
                  (viewYear === currentYear &&
                    viewMonth === currentMonth &&
                    day < currentDay);

                const isToday =
                  viewYear === currentYear &&
                  viewMonth === currentMonth &&
                  day === currentDay;

                const isSelected =
                  selectedDate.year === viewYear &&
                  selectedDate.month === viewMonth &&
                  selectedDate.day === day;

                return (
                  <Pressable
                    key={di}
                    style={styles.dayCell}
                    disabled={isPast}
                    onPress={() =>
                      !isPast &&
                      setSelectedDate({
                        year: viewYear,
                        month: viewMonth,
                        day,
                      })
                    }>
                    {isSelected ? (
                      <View style={styles.selectedCircle}>
                        <Text style={styles.selectedDayText}>{day}</Text>
                      </View>
                    ) : (
                      <View style={styles.dayInner}>
                        <Text
                          style={[
                            styles.dayText,
                            isPast && styles.dayTextPast,
                            isToday && styles.dayTextToday,
                          ]}>
                          {day}
                        </Text>
                        {isToday && <View style={styles.todayDot} />}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Bare Time Section */}
        <View style={styles.timeSection}>
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>Time</Text>
            <Pressable style={styles.bareTimeBtn} onPress={openTimeModal}>
              <Text style={styles.bareTimeText}>{formattedTime}</Text>
              <Text style={styles.bareTimeEditIcon}>✎</Text>
            </Pressable>
          </View>

          {/* Bare Quick Time Presets */}
          <View style={styles.presetRow}>
            {TIME_PRESETS.map((p) => {
              const isActive = formattedTime === p;
              return (
                <Pressable
                  key={p}
                  style={styles.barePresetChip}
                  onPress={() => applyPreset(p)}>
                  <Text
                    style={[
                      styles.barePresetText,
                      isActive && styles.barePresetTextActive,
                    ]}>
                    {p}
                  </Text>
                  {isActive && <View style={styles.presetUnderline} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bare Minimal Time Editor Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setShowTimeModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Finish Time</Text>

            {/* Time Display with bare steppers & inputs */}
            <View style={styles.timeEditGrid}>
              {/* Hour Column */}
              <View style={styles.timeCol}>
                <Pressable
                  style={styles.bareStepperBtn}
                  onPress={() => adjustTempHour(1)}>
                  <Text style={styles.bareStepperArrow}>▲</Text>
                </Pressable>
                <TextInput
                  style={styles.bareTimeInput}
                  value={tempHour}
                  onChangeText={(val) =>
                    setTempHour(val.replace(/[^0-9]/g, '').slice(0, 2))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Pressable
                  style={styles.bareStepperBtn}
                  onPress={() => adjustTempHour(-1)}>
                  <Text style={styles.bareStepperArrow}>▼</Text>
                </Pressable>
              </View>

              <Text style={styles.colonSeparator}>:</Text>

              {/* Minute Column */}
              <View style={styles.timeCol}>
                <Pressable
                  style={styles.bareStepperBtn}
                  onPress={() => adjustTempMinute(5)}>
                  <Text style={styles.bareStepperArrow}>▲</Text>
                </Pressable>
                <TextInput
                  style={styles.bareTimeInput}
                  value={tempMinute}
                  onChangeText={(val) =>
                    setTempMinute(val.replace(/[^0-9]/g, '').slice(0, 2))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Pressable
                  style={styles.bareStepperBtn}
                  onPress={() => adjustTempMinute(-5)}>
                  <Text style={styles.bareStepperArrow}>▼</Text>
                </Pressable>
              </View>

              {/* Bare AM / PM Toggle */}
              <View style={styles.barePeriodCol}>
                <Pressable
                  style={styles.barePeriodBtn}
                  onPress={() => setTempPeriod('AM')}>
                  <Text
                    style={[
                      styles.barePeriodText,
                      tempPeriod === 'AM' && styles.barePeriodTextActive,
                    ]}>
                    AM
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.barePeriodBtn}
                  onPress={() => setTempPeriod('PM')}>
                  <Text
                    style={[
                      styles.barePeriodText,
                      tempPeriod === 'PM' && styles.barePeriodTextActive,
                    ]}>
                    PM
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveTime}>
                <Text style={styles.modalSaveText}>Save Time</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setShowMonthModal(false)}
          />
          <View style={styles.monthModalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <ScrollView
              style={styles.monthListScroll}
              showsVerticalScrollIndicator={false}>
              {availableMonths.map((item) => {
                const isCurrentView =
                  viewYear === item.year && viewMonth === item.month;
                return (
                  <Pressable
                    key={`${item.year}-${item.month}`}
                    style={styles.monthListItem}
                    onPress={() => {
                      setViewYear(item.year);
                      setViewMonth(item.month);
                      setShowMonthModal(false);
                    }}>
                    <Text
                      style={[
                        styles.monthListItemText,
                        isCurrentView && styles.monthListItemTextActive,
                      ]}>
                      {item.label}
                    </Text>
                    {isCurrentView && (
                      <Text style={styles.monthListCheckmark}>✓</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setShowMonthModal(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push('/create/reveal-settings')}>
          <Text style={styles.nextBtnLabel}>Next</Text>
          <Text style={styles.nextBtnIcon}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backIcon: { fontSize: 24, color: C.onSurface },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },

  headline: {
    ...T.headlineLgMobile,
    textAlign: 'center',
    color: C.onSurface,
    marginBottom: 12,
  },
  subtext: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 24,
  },

  /* Calendar */
  calendarWrap: { width: '100%', marginBottom: 16 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnDisabled: { opacity: 0.2 },
  monthNavArrow: { fontSize: 22, color: C.onSurface },
  monthNavArrowDisabled: { color: C.onSurfaceVariant },
  monthLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  monthLabel: { ...T.headlineMd, fontSize: 22, color: C.onSurface },
  monthChevron: { fontSize: 13, color: C.primary },

  daysHeader: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderCell: { flex: 1, alignItems: 'center' },
  dayHeaderText: {
    ...T.label,
    fontSize: 10,
    textTransform: 'uppercase',
    color: C.onSurfaceVariant,
  },

  weekRow: { flexDirection: 'row', marginBottom: 6 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 38 },
  dayInner: { alignItems: 'center', justifyContent: 'center' },
  dayText: { ...T.bodyMd, fontSize: 15, color: C.onSurface },
  dayTextPast: { color: C.onSurfaceVariant, opacity: 0.25 },
  dayTextToday: { color: C.primary, fontWeight: '700' },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
    marginTop: 2,
  },
  selectedCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedDayText: { ...T.bodyMd, color: C.onPrimary, fontWeight: '700' },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
  },

  /* Bare Time Section */
  timeSection: { width: '100%', gap: 10 },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  timeLabel: {
    ...T.label,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: C.onSurfaceVariant,
  },
  bareTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  bareTimeText: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.5,
  },
  bareTimeEditIcon: {
    fontSize: 13,
    color: C.primary,
    opacity: 0.75,
  },

  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  barePresetChip: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  barePresetText: {
    ...T.bodyMd,
    fontSize: 13,
    color: C.onSurfaceVariant,
    opacity: 0.55,
  },
  barePresetTextActive: {
    color: C.primary,
    fontWeight: '700',
    opacity: 1,
  },
  presetUnderline: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.primary,
    marginTop: 3,
  },

  /* Bare Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { ...T.headlineMd, fontSize: 20, color: C.onSurface },

  timeEditGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 4,
  },
  timeCol: { alignItems: 'center', gap: 2 },
  bareStepperBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bareStepperArrow: { fontSize: 14, color: C.onSurfaceVariant },
  bareTimeInput: {
    width: 68,
    height: 58,
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,196,153,0.4)',
    padding: 0,
  },
  colonSeparator: {
    fontSize: 40,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    opacity: 0.5,
  },

  barePeriodCol: {
    gap: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barePeriodBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  barePeriodText: {
    ...T.label,
    fontSize: 16,
    color: C.onSurfaceVariant,
    opacity: 0.35,
  },
  barePeriodTextActive: {
    color: C.primary,
    opacity: 1,
    fontWeight: '700',
  },

  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { ...T.bodyMd, color: C.onSurfaceVariant },
  modalSaveBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    ...T.bodyMd,
    color: C.onPrimary,
    fontWeight: '700',
  },

  /* Month Picker Modal */
  monthModalContent: {
    width: '100%',
    maxWidth: 300,
    maxHeight: 440,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  monthListScroll: { width: '100%' },
  monthListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  monthListItemText: { ...T.bodyMd, color: C.onSurface },
  monthListItemTextActive: { color: C.primary, fontWeight: '700' },
  monthListCheckmark: { color: C.primary, fontSize: 16, fontWeight: '700' },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: { ...T.bodyMd, color: C.onSurfaceVariant },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${C.onSurfaceVariant}33`,
  },
  dotActive: { backgroundColor: C.onSurface },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.secondaryFixed,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
  },
  nextBtnLabel: { ...T.bodyMd, fontWeight: '500', color: C.onSecondaryFixed },
  nextBtnIcon: { fontSize: 16, color: C.onSecondaryFixed },
});
