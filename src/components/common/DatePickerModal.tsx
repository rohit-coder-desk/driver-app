import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

interface DatePickerModalProps {
  visible: boolean;
  value: string; // 'YYYY-MM-DD'
  onSelect: (dateStr: string) => void;
  onClose: () => void;
  minDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  onSelect,
  onClose,
  minDate,
}) => {
  // Set minimum date to today (defaults to today)
  const effectiveMinDate = useMemo(() => {
    if (minDate) return minDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [minDate]);

  // Parse initial value or default to tomorrow/minDate
  const initialDateObj = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const tomorrow = new Date(effectiveMinDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }, [value, effectiveMinDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDateObj.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDateObj.getDate());
  const [showYearPicker, setShowYearPicker] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setCurrentYear(initialDateObj.getFullYear());
      setCurrentMonth(initialDateObj.getMonth());
      setSelectedDay(initialDateObj.getDate());
      setShowYearPicker(false);
    }
  }, [visible, initialDateObj]);

  const yearsList = useMemo(() => {
    const startYear = effectiveMinDate.getFullYear();
    const years = [];
    for (let y = startYear; y <= startYear + 20; y++) {
      years.push(y);
    }
    return years;
  }, [effectiveMinDate]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleConfirm = () => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onSelect(dateStr);
    onClose();
  };

  const calendarGrid = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: 0, disabled: true, isPadding: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(currentYear, currentMonth, d);
      cellDate.setHours(23, 59, 59, 999);
      const isDisabled = cellDate < effectiveMinDate;
      cells.push({ day: d, disabled: isDisabled, isPadding: false });
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek, effectiveMinDate]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.cardContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Select Licence Expiry Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Selector Header */}
          <View style={styles.monthSelectorRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn} activeOpacity={0.7}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowYearPicker(!showYearPicker)} style={styles.monthYearTitleBox} activeOpacity={0.7}>
              <Text style={styles.monthYearTitle}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
              <Text style={styles.dropdownCaret}>{showYearPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn} activeOpacity={0.7}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Year Picker Grid Overlay */}
          {showYearPicker ? (
            <View style={styles.yearPickerGridContainer}>
              <Text style={styles.yearPickerGuide}>Select Expiry Year:</Text>
              <ScrollView contentContainerStyle={styles.yearGrid} showsVerticalScrollIndicator={false}>
                {yearsList.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.yearItem, yr === currentYear && styles.yearItemSelected]}
                    onPress={() => {
                      setCurrentYear(yr);
                      setShowYearPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.yearItemText, yr === currentYear && styles.yearItemTextSelected]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Weekday Labels Header */}
              <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map((wd) => (
                  <Text key={wd} style={styles.weekDayText}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {calendarGrid.map((cell, index) => {
                  if (cell.isPadding) {
                    return <View key={`pad_${index}`} style={styles.dayCell} />;
                  }

                  const isSelected = cell.day === selectedDay;

                  return (
                    <TouchableOpacity
                      key={`day_${cell.day}`}
                      disabled={cell.disabled}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        cell.disabled && styles.dayCellDisabled,
                      ]}
                      onPress={() => setSelectedDay(cell.day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          cell.disabled && styles.dayTextDisabled,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Selected Date Summary Display */}
          <View style={styles.selectedSummaryRow}>
            <Text style={styles.summaryLabel}>Expiry Date:</Text>
            <Text style={styles.summaryValue}>
              {`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
            </Text>
          </View>

          {/* Bottom Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn} activeOpacity={0.8}>
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: -2,
  },
  monthYearTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthYearTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  dropdownCaret: {
    fontSize: 12,
    color: '#60A5FA',
  },
  yearPickerGridContainer: {
    height: 240,
  },
  yearPickerGuide: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginBottom: 12,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearItem: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: '#0D2A54',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  yearItemSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  yearItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  yearItemTextSelected: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#60A5FA',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 22,
  },
  dayCellSelected: {
    backgroundColor: '#0066FF',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  dayTextSelected: {
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  dayTextDisabled: {
    color: '#64748B',
  },
  selectedSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#60A5FA',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0D2A54',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  confirmBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
