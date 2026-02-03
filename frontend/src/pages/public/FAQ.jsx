const faqs = [
  {
    question: 'How do I book a trip?',
    answer: 'You can book a trip by selecting your departure city, destination, travel date, and number of passengers on our booking page. Then choose from available trips and proceed to payment.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept Telebirr, Chapa, and cash payments at our stations.',
  },
  {
    question: 'Can I cancel or reschedule my booking?',
    answer: 'Yes, you can cancel or reschedule your booking through your account dashboard, subject to our cancellation policy.',
  },
  {
    question: 'How do I become a driver?',
    answer: 'You can apply to become a driver through our "Drive with Us" page. We require a valid driver\'s license and vehicle registration.',
  },
];

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="card p-6">
            <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}