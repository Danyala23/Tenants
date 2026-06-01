import { useState } from 'react';
import { Card, Text, Button } from 'react-native-paper';
import { View } from 'react-native';
import { monthLabel } from '../utils/dateUtils';
import type { Occupancy, RentPayment, RentIncreaseRule } from '../types';

interface TenantCardProps {
  occ: Occupancy;
  currentYear: number;
  currentMonth: number;
  currentPayment: RentPayment | undefined;
  rentIncrease: RentIncreaseRule | null;
  payments: RentPayment[];
  dues: number;
  totalDue: number;
  isPendingIncrease: boolean;
  onEdit: (occ: Occupancy) => void;
  onRemove: (occ: Occupancy) => void;
  onCollect: (occId: number, rent: number) => void;
  onAdjustIncrease: (occId: number) => void;
  onViewTenant?: (tenantId: number) => void;
}

export function TenantCard({
  occ,
  currentYear,
  currentMonth,
  currentPayment,
  rentIncrease,
  payments,
  dues,
  totalDue,
  isPendingIncrease,
  onEdit,
  onRemove,
  onCollect,
  onAdjustIncrease,
  onViewTenant,
}: TenantCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <View style={{ flex: 1 }}>
            <Text
              variant="titleSmall"
              onPress={() => onViewTenant?.(occ.tenantId)}
              style={onViewTenant ? { textDecorationLine: 'underline' } : undefined}
            >
              {occ.tenantName}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>{occ.tenantPhone}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Button compact onPress={() => onEdit(occ)}>Edit</Button>
            <Button compact onPress={() => onRemove(occ)} textColor="#d32f2f">Remove</Button>
          </View>
        </View>
        <Text variant="bodySmall" style={{ marginTop: 8, opacity: 0.7 }}>
          Since {occ.startDate?.slice(0, 10)} · Rent: Rs. {occ.rent.toLocaleString()} · Deposit: Rs. {occ.securityDeposit.toLocaleString()}
        </Text>

        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
          <Text variant="labelSmall">{monthLabel(currentMonth, currentYear)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            <Text
              variant="labelMedium"
              style={{
                color: currentPayment?.isPaid ? '#2e7d32' : currentPayment ? '#ed6c02' : '#666',
                marginRight: 8,
              }}
            >
              {currentPayment
                ? currentPayment.isPaid
                  ? 'Paid'
                  : `Partial: Rs. ${currentPayment.amountPaid.toLocaleString()}`
                : 'Not Collected'}
            </Text>
            {dues > 0 && (
              <Text variant="labelSmall" style={{ color: '#d32f2f' }}>
                Dues: Rs. {dues.toLocaleString()}
              </Text>
            )}
            <Button
              compact
              mode={currentPayment?.isPaid ? 'outlined' : 'contained'}
              onPress={() => onCollect(occ.id, occ.rent)}
              style={{ marginLeft: 'auto' }}
            >
              {currentPayment?.isPaid ? 'Update' : 'Collect'}
            </Button>
          </View>
          {dues > 0 && (
            <Text variant="bodySmall" style={{ marginTop: 4, opacity: 0.7 }}>
              Total due: Rs. {totalDue.toLocaleString()}
            </Text>
          )}

          {rentIncrease && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                Next increase: {rentIncrease.nextIncreaseDate?.slice(0, 10)} ({rentIncrease.increasePercent}%)
              </Text>
              <Button compact onPress={() => onAdjustIncrease(occ.id)}>Edit</Button>
            </View>
          )}

          <Button compact onPress={() => setExpanded(!expanded)} style={{ marginTop: 8 }}>
            {expanded ? 'Hide' : 'Show'} History
          </Button>

          {expanded && payments.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {payments.map((p) => {
                const shortfall = occ.rent - p.amountPaid;
                return (
                  <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text variant="bodySmall">{monthLabel(p.month, p.year)}</Text>
                    <Text variant="bodySmall">Rs. {p.amountPaid.toLocaleString()}</Text>
                    <Text variant="bodySmall" style={{ color: shortfall > 0 ? '#d32f2f' : undefined }}>
                      {shortfall > 0 ? `Due: Rs. ${shortfall.toLocaleString()}` : '—'}
                    </Text>
                    <Text variant="labelSmall" style={{ color: p.isPaid ? '#2e7d32' : '#ed6c02' }}>
                      {p.isPaid ? 'Paid' : 'Partial'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}
