import { Modal, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';

interface BillSnapshotModalProps {
  visible: boolean;
  html: string | null;
  onDismiss: () => void;
}

export default function BillSnapshotModal({
  visible,
  html,
  onDismiss,
}: BillSnapshotModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button onPress={onDismiss}>Close</Button>
        </View>
        {html ? (
          <WebView
            source={{ html }}
            style={styles.webview}
            originWhitelist={['*']}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text>Loading...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16 },
  webview: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
