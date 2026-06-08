import { Card, Text, Button } from 'react-native-paper';
import type { Property, BillSummary } from '../types';
import { Colors } from '../theme';

interface PropertyCardProps {
  property: Property;
  billSummary?: BillSummary | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PropertyCard({ property, billSummary, onView, onEdit, onDelete }: PropertyCardProps) {
  const hasBills = billSummary && billSummary.totalCount > 0;
  const unpaidCount = billSummary?.unpaidCount ?? 0;

  return (
    <Card style={{ marginBottom: 12 }} onPress={onView}>
      <Card.Content>
        <Text variant="titleMedium">
          {property.houseNumber || '—'} {property.address}
        </Text>
        <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
          {property.size} Marla{property.size !== 1 ? 's' : ''}
        </Text>
        {hasBills && (
          <Text
            variant="labelMedium"
            style={{
              marginTop: 8,
              color: unpaidCount > 0 ? Colors.error : Colors.success,
            }}
          >
            {unpaidCount > 0
              ? `${unpaidCount} unpaid bill${unpaidCount !== 1 ? 's' : ''}`
              : 'All paid'}
          </Text>
        )}
        <Card.Actions>
          <Button onPress={onView}>View</Button>
          <Button onPress={onEdit}>Edit</Button>
          <Button onPress={onDelete} textColor={Colors.error}>
            Delete
          </Button>
        </Card.Actions>
      </Card.Content>
    </Card>
  );
}
