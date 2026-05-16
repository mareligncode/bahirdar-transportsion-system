import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/common/AppText';
import { ScreenLayout } from '../../../components/layout';
import { FAQ, ContactForm, Feedback } from '../../../types/support';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';

const SupportScreen = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'feedback'>('faq');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'inquiry',
  });
  const [feedback, setFeedback] = useState<Feedback>({
    rating: 0,
    comment: '',
    category: 'app',
  });

  const faqs: FAQ[] = [
    {
      id: '1',
      question: translate('faq_booking_q1'),
      answer: translate('faq_booking_a1'),
      category: 'booking',
    },
    {
      id: '2',
      question: translate('faq_payment_q1'),
      answer: translate('faq_payment_a1'),
      category: 'payment',
    },
    {
      id: '3',
      question: translate('faq_booking_q2'),
      answer: translate('faq_booking_a2'),
      category: 'booking',
    },
    {
      id: '4',
      question: translate('faq_account_q1'),
      answer: translate('faq_account_a1'),
      category: 'account',
    },
    {
      id: '5',
      question: translate('faq_general_q1'),
      answer: translate('faq_general_a1'),
      category: 'general',
    },
    {
      id: '6',
      question: translate('faq_trip_q1'),
      answer: translate('faq_trip_a1'),
      category: 'trip',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categoryLabels: Record<string, string> = {
    general: translate('cat_general'),
    booking: translate('cat_booking'),
    payment: translate('cat_payment'),
    account: translate('cat_account'),
    trip: translate('cat_trips'),
  };

  const handleSubmitContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      Alert.alert(translate('error'), translate('field_required_error'));
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(translate('success'), translate('contact_success_desc'));
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'inquiry',
      });
    }, 1500);
  };

  const handleSubmitFeedback = async () => {
    if (feedback.rating === 0) {
      Alert.alert(translate('error'), translate('select_rating_error'));
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(translate('thank_you'), translate('feedback_thanks'));
      setFeedback({
        rating: 0,
        comment: '',
        category: 'app',
      });
    }, 1500);
  };

  const FAQItem = ({ faq, index }: { faq: FAQ; index: number }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          className="flex-row justify-between items-center py-4 px-4"
        >
          <AppText weight="medium" className={`flex-1 ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>
            {faq.question}
          </AppText>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isDark ? colors.textSecondary : "#9CA3AF"}
          />
        </TouchableOpacity>
        {expanded && (
          <View className="px-4 pb-4">
            <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{faq.answer}</AppText>
          </View>
        )}
      </View>
    );
  };

  const renderFAQ = () => (
    <View className="flex-1">
      <View className="px-4 py-3">
        <View className={`flex-row items-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg px-3 py-2`}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder={translate('search_faqs')}
            placeholderTextColor="#9CA3AF"
            className={`flex-1 ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <View key={category}>
            <View className="bg-gray-100 dark:bg-gray-800 px-4 py-2">
              <AppText weight="semibold" className="text-gray-600 dark:text-gray-300">
                {categoryLabels[category] || category}
              </AppText>
            </View>
            {categoryFaqs.map((faq, index) => (
              <FAQItem key={faq.id} faq={faq} index={index} />
            ))}
          </View>
        ))}

        {filteredFaqs.length === 0 && (
          <View className="py-8 px-4">
            <AppText className="text-center text-gray-500 dark:text-gray-400">
              {translate('no_faqs_found')}
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderContact = () => (
    <ScrollView className="flex-1 p-4">
      <View className="mb-4">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('contact_type')}
        </AppText>
        <View className="flex-row flex-wrap">
          {(['inquiry', 'complaint', 'feedback', 'other'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setContactForm({ ...contactForm, type })}
              className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                contactForm.type === type
                  ? 'bg-blue-600 border-blue-600'
                  : `border-gray-300 ${isDark ? 'border-gray-600' : ''}`
              }`}
            >
              <AppText
                className={
                  contactForm.type === type
                    ? 'text-white'
                    : isDark ? 'text-gray-300' : 'text-gray-700'
                }
              >
                {translate(type)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('full_name')} *
        </AppText>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={translate('full_name_placeholder')}
          placeholderTextColor="#9CA3AF"
          value={contactForm.name}
          onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
        />
      </View>

      <View className="mb-4">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('email_address')} *
        </AppText>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={translate('email_placeholder')}
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={contactForm.email}
          onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
        />
      </View>

      <View className="mb-4">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('subject_label')}
        </AppText>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={translate('subject_label')}
          placeholderTextColor="#9CA3AF"
          value={contactForm.subject}
          onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
        />
      </View>

      <View className="mb-6">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('message_label')}
        </AppText>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={translate('how_can_we_help')}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={contactForm.message}
          onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmitContact}
        disabled={loading}
        className="bg-blue-600 py-4 rounded-lg mb-8"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <AppText weight="semibold" className="text-white text-center">{translate('send_message_btn')}</AppText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFeedback = () => (
    <ScrollView className="flex-1 p-4">
      <View className="mb-6">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-4 text-center">
          {translate('rate_experience')}
        </AppText>
        <View className="flex-row justify-center space-x-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setFeedback({ ...feedback, rating: star })}
            >
              <Ionicons
                name={star <= feedback.rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= feedback.rating ? '#FBBF24' : '#9CA3AF'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('category_label')}
        </AppText>
        <View className="flex-row flex-wrap">
          {(['app', 'service', 'booking', 'other'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setFeedback({ ...feedback, category })}
              className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                feedback.category === category
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <AppText
                className={
                  feedback.category === category
                    ? 'text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }
              >
                {translate(`${category}_category` as any)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-6">
        <AppText weight="medium" className="text-gray-700 dark:text-gray-300 mb-2">
          {translate('additional_comments')}
        </AppText>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder={translate('additional_comments' as any)}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={feedback.comment}
          onChangeText={(text) => setFeedback({ ...feedback, comment: text })}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmitFeedback}
        disabled={loading}
        className="bg-blue-600 py-4 rounded-lg mb-8"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <AppText weight="semibold" className="text-white text-center">{translate('submit_feedback_btn')}</AppText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <ScreenLayout>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className={`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? colors.textSecondary : "#4B5563"} />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold" className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
            {translate('support')}
          </AppText>
        </View>

        <View className={`flex-row border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {(['faq', 'contact', 'feedback'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 ${
                activeTab === tab ? 'border-b-2 border-blue-600' : ''
              }`}
            >
              <AppText
                className={`text-center font-medium ${
                  activeTab === tab
                    ? 'text-blue-600'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {translate(`${tab}_tab`)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'faq' && renderFAQ()}
        {activeTab === 'contact' && renderContact()}
        {activeTab === 'feedback' && renderFeedback()}
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default SupportScreen;