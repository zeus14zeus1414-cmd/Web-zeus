import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import styles from '../styles/AppStyles';

const AddWebsiteModal = ({
  visible,
  onClose,
  onAdd,
  initialName,
  initialUrl,
}) => {
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);

  const handleAdd = () => {
    if (name && url) {
      onAdd(name, url);
      onClose();
      setName('');
      setUrl('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>إضافة موقع</Text>
          <TextInput
            style={styles.input}
            placeholder="الاسم"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="الرابط"
            placeholderTextColor="#888"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleAdd}
              disabled={!name || !url}>
              <Text style={styles.modalButtonTextPrimary}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddWebsiteModal;
