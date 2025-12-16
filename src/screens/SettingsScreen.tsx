import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
import { ColorPalette, Language } from '../types';

export const SettingsScreen: React.FC = () => {
  const {
    theme,
    isDarkMode,
    toggleDarkMode,
    currentPalette,
    setPalette,
    allPalettes,
  } = useTheme();
  const { t, currentLanguage, setLanguage, allLanguages } = useLanguage();

  const [isPaletteModalVisible, setIsPaletteModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const handleDarkModeToggle = async () => {
    await toggleDarkMode();
    Toast.show({
      type: 'success',
      text1: t('settings.themeChanged'),
      visibilityTime: 1500,
    });
  };

  const handlePaletteSelect = async (palette: ColorPalette) => {
    await setPalette(palette.id);
    setIsPaletteModalVisible(false);
    Toast.show({
      type: 'success',
      text1: t('settings.paletteChanged'),
      visibilityTime: 1500,
    });
  };

  const handleLanguageSelect = async (language: Language) => {
    await setLanguage(language.code);
    setIsLanguageModalVisible(false);
    Toast.show({
      type: 'success',
      text1: t('settings.languageChanged'),
      visibilityTime: 1500,
    });
  };

  const renderPalettePreview = (palette: ColorPalette) => (
    <View style={styles.palettePreview}>
      {palette.preview.map((color, index) => (
        <View
          key={index}
          style={[styles.paletteColor, { backgroundColor: color }]}
        />
      ))}
    </View>
  );

  const renderPaletteItem = ({ item }: { item: ColorPalette }) => (
    <TouchableOpacity
      style={[
        styles.paletteItem,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor:
            currentPalette.id === item.id
              ? theme.colors.primary
              : 'transparent',
        },
      ]}
      onPress={() => handlePaletteSelect(item)}
    >
      <View style={styles.paletteItemContent}>
        <Text style={[styles.paletteName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        {renderPalettePreview(item)}
      </View>
      {currentPalette.id === item.id && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor:
            currentLanguage.code === item.code
              ? theme.colors.primary
              : 'transparent',
        },
      ]}
      onPress={() => handleLanguageSelect(item)}
    >
      <View style={styles.languageItemContent}>
        <Text style={styles.languageFlag}>{item.flag}</Text>
        <View style={styles.languageNames}>
          <Text style={[styles.languageName, { color: theme.colors.text }]}>
            {item.nativeName}
          </Text>
          <Text
            style={[
              styles.languageEnglishName,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.name}
          </Text>
        </View>
      </View>
      {currentLanguage.code === item.code && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('settings.title')}
          </Text>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Appearance
        </Text>

        {/* Color Palette */}
        <Card
          style={styles.settingCard}
          onPress={() => setIsPaletteModalVisible(true)}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="color-palette-outline"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('settings.colorPalette')}
                </Text>
                <Text
                  style={[
                    styles.settingValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {currentPalette.name}
                </Text>
              </View>
            </View>
            {renderPalettePreview(currentPalette)}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.placeholder}
            />
          </View>
        </Card>

        {/* Dark Mode */}
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="moon-outline"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('settings.darkMode')}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('settings.darkModeDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + '80',
              }}
              thumbColor={isDarkMode ? theme.colors.primary : '#FFF'}
            />
          </View>
        </Card>

        {/* Language Section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textSecondary, marginTop: 24 },
          ]}
        >
          {t('settings.language')}
        </Text>

        <Card
          style={styles.settingCard}
          onPress={() => setIsLanguageModalVisible(true)}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="globe-outline"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('settings.language')}
                </Text>
                <Text
                  style={[
                    styles.settingValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {currentLanguage.flag} {currentLanguage.nativeName}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.placeholder}
            />
          </View>
        </Card>

        {/* About Section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textSecondary, marginTop: 24 },
          ]}
        >
          {t('settings.about')}
        </Text>

        <Card style={styles.settingCard}>
          <View style={styles.aboutContent}>
            <View
              style={[
                styles.appIcon,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.appName, { color: theme.colors.text }]}>
              {t('settings.appName')}
            </Text>
            <Text
              style={[
                styles.appDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t('settings.appDescription')}
            </Text>
            <Text style={[styles.version, { color: theme.colors.placeholder }]}>
              {t('settings.version')} 1.0.0
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Color Palette Modal */}
      <Modal
        visible={isPaletteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPaletteModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.selectPalette')}
            </Text>
            <TouchableOpacity
              onPress={() => setIsPaletteModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={allPalettes}
            keyExtractor={item => item.id}
            renderItem={renderPaletteItem}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            <TouchableOpacity
              onPress={() => setIsLanguageModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={allLanguages}
            keyExtractor={item => item.code}
            renderItem={renderLanguageItem}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
    paddingLeft: 4,
  },
  settingCard: {
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    marginTop: 2,
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  palettePreview: {
    flexDirection: 'row',
    marginRight: 12,
  },
  paletteColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginLeft: 2,
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    padding: 16,
  },
  paletteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  paletteItemContent: {
    flex: 1,
  },
  paletteName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageNames: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageEnglishName: {
    fontSize: 13,
    marginTop: 2,
  },
});
