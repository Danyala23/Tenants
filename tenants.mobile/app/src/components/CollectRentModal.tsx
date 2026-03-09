import { Dialog, TextInput, Button, Text } from 'react-native-paper';
import { monthLabel } from '../utils/dateUtils';

interface CollectRentModalProps {
  visible: boolean;
  rent: number;
  dues: number;
  amount: number;
  currentMonth: number;
  currentYear: number;
  onAmountChange: (amount: number) => void;
  onSubmit: () => void;
  onDismiss: () => void;
}

export default function CollectRentModal({
  visible,
  rent,
  dues,
  amount,
  currentMonth,
  currentYear,
  onAmountChange,
  onSubmit,
  onDismiss,
}: CollectRentModalProps) {
  const totalDue = rent + dues;

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Collect Rent — {monthLabel(currentMonth, currentYear)}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium">Monthly Rent: Rs. {rent.toLocaleString()}</Text>
        {dues > 0 && (
          <>
            <Text variant="bodyMedium" style={{ color: '#d32f2f' }}>
              Previous Dues: Rs. {dues.toLocaleString()}
            </Text>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
              Total Due: Rs. {totalDue.toLocaleString()}
            </Text>
          </>
        )}
        <TextInput
          label="Amount Collected"
          value={amount ? String(amount) : ''}
          onChangeText={(t) => onAmountChange(parseFloat(t) || 0)}
          mode="outlined"
          keyboardType="decimal-pad"
          style={{ marginTop: 16 }}
        />
        {amount > 0 && amount < totalDue && (
          <Text variant="bodySmall" style={{ color: '#ed6c02', marginTop: 8 }}>
            Partial payment — Rs. {(totalDue - amount).toLocaleString()} will carry over.
          </Text>
        )}
        {amount >= totalDue && amount > 0 && (
          <Text variant="bodySmall" style={{ color: '#2e7d32', marginTop: 8 }}>
            Full payment — no outstanding dues.
          </Text>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={onSubmit}>Collect</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
