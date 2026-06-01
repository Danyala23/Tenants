import { useState, useEffect } from 'react';
import { Dialog, TextInput, Button } from 'react-native-paper';
import type { Property } from '../types';

interface PropertyModalProps {
  visible: boolean;
  property: Property | null;
  onDismiss: () => void;
  onSave: (data: { houseNumber: string; address: string; size: number }) => void;
  onDelete?: () => void;
}

export default function PropertyModal({
  visible,
  property,
  onDismiss,
  onSave,
  onDelete,
}: PropertyModalProps) {
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    if (visible) {
      setHouseNumber(property?.houseNumber ?? '');
      setAddress(property?.address ?? '');
      setSize(property ? String(property.size) : '');
    }
  }, [visible, property]);

  const handleSave = () => {
    const sizeNum = parseFloat(size) || 0;
    if (!houseNumber.trim() || !address.trim()) return;
    onSave({
      houseNumber: houseNumber.trim(),
      address: address.trim(),
      size: sizeNum,
    });
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{property ? 'Edit Property' : 'Add Property'}</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="House Number"
          value={houseNumber}
          onChangeText={setHouseNumber}
          mode="outlined"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Size (Marlas)"
          value={size}
          onChangeText={setSize}
          mode="outlined"
          keyboardType="decimal-pad"
        />
      </Dialog.Content>
      <Dialog.Actions>
        {onDelete && property ? (
          <Button textColor="#d32f2f" onPress={onDelete}>
            Delete
          </Button>
        ) : null}
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={handleSave}>Save</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
