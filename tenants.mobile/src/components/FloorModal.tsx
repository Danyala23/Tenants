import { useState, useEffect } from 'react';
import { Dialog, TextInput, Button } from 'react-native-paper';
import type { Floor } from '../types';

interface FloorModalProps {
  visible: boolean;
  editingFloor: Floor | null;
  defaultFloorNumber: number;
  onDismiss: () => void;
  onSave: (data: { floorNumber: number; label?: string }) => void;
}

export default function FloorModal({
  visible,
  editingFloor,
  defaultFloorNumber,
  onDismiss,
  onSave,
}: FloorModalProps) {
  const [floorNumber, setFloorNumber] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (visible) {
      setFloorNumber(String(editingFloor?.floorNumber ?? defaultFloorNumber));
      setLabel(editingFloor?.label ?? '');
    }
  }, [visible, editingFloor, defaultFloorNumber]);

  const handleSave = () => {
    const num = parseInt(floorNumber, 10);
    if (isNaN(num)) return;
    onSave({ floorNumber: num, label: label.trim() || undefined });
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{editingFloor ? 'Edit Floor' : 'Add Floor'}</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Floor Number"
          value={floorNumber}
          onChangeText={setFloorNumber}
          mode="outlined"
          keyboardType="number-pad"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Label"
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Ground, 1st"
          mode="outlined"
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={handleSave}>{editingFloor ? 'Save' : 'Add'}</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
