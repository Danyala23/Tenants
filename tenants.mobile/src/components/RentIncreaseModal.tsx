import { useState, useEffect } from 'react';
import { Dialog, TextInput, Button } from 'react-native-paper';

interface RentIncreaseModalProps {
  visible: boolean;
  increasePercent: number;
  nextIncreaseDate: string;
  onDismiss: () => void;
  onSave: (data: { increasePercent: number; nextIncreaseDate: string }) => void;
}

export default function RentIncreaseModal({
  visible,
  increasePercent,
  nextIncreaseDate,
  onDismiss,
  onSave,
}: RentIncreaseModalProps) {
  const [percent, setPercent] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (visible) {
      setPercent(String(increasePercent));
      setDate(nextIncreaseDate.slice(0, 10));
    }
  }, [visible, increasePercent, nextIncreaseDate]);

  const handleSave = () => {
    const p = parseFloat(percent) || 0;
    if (!date) return;
    onSave({ increasePercent: p, nextIncreaseDate: date });
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Edit Rent Increase Rule</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Increase %"
          value={percent}
          onChangeText={setPercent}
          mode="outlined"
          keyboardType="decimal-pad"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Next Increase Date"
          value={date}
          onChangeText={setDate}
          mode="outlined"
          placeholder="YYYY-MM-DD"
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={handleSave}>Save</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
