/**
 * ============================================================================
 * SLAMLY — SAMPLE / MOCK DATA FOR MILESTONE 1
 * ============================================================================
 * IMPORTANT ARCHITECTURAL NOTE:
 * This file contains static sample data used exclusively for Milestone 1 UI
 * previews. In Milestone 2+, these will be replaced by live Cloud Firestore
 * queries scoped to the authenticated Firebase user (`users/{uid}/books`).
 * ============================================================================
 */

export const MOCK_USER_PROFILE = {
  displayName: 'Aanya',
  tagline: 'Keeping little notes from my favourite people',
};

export const MOCK_SLAM_BOOKS = [
  {
    id: 'book-class-of-2026',
    title: 'Class of 2026 — Final Semester Slam Book',
    subtitle: 'Hostel wing 3B, late-night chai runs & classroom memories',
    coverColor: '#FAD2DD',
    tapeClass: '',
    themeName: 'Rose Quartz Journal',
    status: 'Open',
    statusCode: 'active',
    responseCount: 18,
    questionCount: 10,
    lastUpdated: '2 hours ago',
    shareSlug: 'slamly.app/s/class-of-2026-x9k2',
    sampleResponses: [
      {
        friendName: 'Rohan ("Ro")',
        submittedAt: 'Oct 28',
        favoriteMemory: 'Getting locked out on the terrace during exam week with 4 cups of Maggi!',
        oneWordForMe: 'Unstoppable',
        songDedication: 'Purani Jeans — Ali Haider',
      },
      {
        friendName: 'Meera K.',
        submittedAt: 'Oct 29',
        favoriteMemory: 'Our 3 AM project debugging session that turned into a karaoke night.',
        oneWordForMe: 'Sunshine',
        songDedication: 'Ilahi — Yeh Jawaani Hai Deewani',
      },
    ],
  },
  {
    id: 'book-inner-circle',
    title: 'My Inner Circle — Core Memories',
    subtitle: 'For the childhood & neighbourhood friends who know all my secrets',
    coverColor: '#E4DAF6',
    tapeClass: 'tape-lavender',
    themeName: 'Lavender Pressed Flower',
    status: 'Open',
    statusCode: 'active',
    responseCount: 9,
    questionCount: 8,
    lastUpdated: 'Yesterday',
    shareSlug: 'slamly.app/s/inner-circle-m4p8',
    sampleResponses: [
      {
        friendName: 'Kabir',
        submittedAt: 'Oct 25',
        favoriteMemory: 'Summer monsoon cycling races and eating mango ice lollies.',
        oneWordForMe: 'Chaotic-Good',
        songDedication: 'Count on Me — Bruno Mars',
      },
    ],
  },
  {
    id: 'book-21st-birthday',
    title: '21st Birthday Time Capsule',
    subtitle: 'Wishes, predictions for 2030, and polaroid snaps from the party',
    coverColor: '#D5E8DA',
    tapeClass: 'tape-sage',
    themeName: 'Sage Botanical',
    status: 'Closed',
    statusCode: 'closed',
    responseCount: 24,
    questionCount: 7,
    lastUpdated: 'Last month',
    shareSlug: 'slamly.app/s/21st-capsule-q7v1',
    sampleResponses: [
      {
        friendName: 'Diya',
        submittedAt: 'Sep 14',
        favoriteMemory: 'Watching you blow out trick candles for 5 minutes straight!',
        oneWordForMe: 'Iconic',
        songDedication: '22 — Taylor Swift',
      },
    ],
  },
  {
    id: 'book-summer-trip-draft',
    title: 'Roadtrip & Backpackers Logbook',
    subtitle: 'Still customising prompts before sharing with the travel group',
    coverColor: '#FDE0C6',
    tapeClass: 'tape-peach',
    themeName: 'Warm Peach Postcard',
    status: 'Draft',
    statusCode: 'draft',
    responseCount: 0,
    questionCount: 6,
    lastUpdated: 'Just now',
    shareSlug: 'Not published yet',
    sampleResponses: [],
  },
];

export const BOOK_TEMPLATES = [
  {
    id: 'friendship',
    title: 'Friendship',
    badge: 'Most Popular',
    tagline: 'Classic slam book prompts for your closest friends',
    description:
      'Capture nicknames, first impressions, inside jokes, song dedications, and the moments you never want to forget.',
    coverColor: '#FAD2DD',
    tapeClass: '',
    defaultQuestions: [
      { id: 'q1', text: 'What is your name & the nickname only we use?', type: 'short_answer', required: true },
      { id: 'q2', text: 'What was your very first impression of me (be honest!)?', type: 'paragraph', required: true },
      { id: 'q3', text: 'Our funniest or most chaotic memory together:', type: 'paragraph', required: true },
      { id: 'q4', text: 'If our friendship had a theme song, what would it be?', type: 'short_answer', required: false },
      { id: 'q5', text: 'One piece of advice or wish you want me to read 5 years from now:', type: 'paragraph', required: true },
    ],
  },
  {
    id: 'college-memories',
    title: 'College memories',
    badge: 'Campus Edition',
    tagline: 'Canteen talks, fest nights, and graduation keepsakes',
    description:
      'Designed for hostel mates, lab partners, and college squads before everyone heads to new cities.',
    coverColor: '#E4DAF6',
    tapeClass: 'tape-lavender',
    defaultQuestions: [
      { id: 'q1', text: 'Your name, department/branch, and our favourite campus hangout spot:', type: 'short_answer', required: true },
      { id: 'q2', text: 'Which lecture, lab, or fest memory with me makes you laugh every time?', type: 'paragraph', required: true },
      { id: 'q3', text: 'Where do you see me 10 years after graduation?', type: 'short_answer', required: false },
      { id: 'q4', text: 'A secret confession or thank-you note before we graduate:', type: 'paragraph', required: true },
    ],
  },
  {
    id: 'school-farewell',
    title: 'School farewell',
    badge: 'Nostalgic Classic',
    tagline: 'Last-bench doodles, tiffin swaps, and farewell autographs',
    description:
      'Inspired by the classic paper slam books passed under school desks during the final month of class.',
    coverColor: '#FDE0C6',
    tapeClass: 'tape-peach',
    defaultQuestions: [
      { id: 'q1', text: 'Your name, roll number, and birthday:', type: 'short_answer', required: true },
      { id: 'q2', text: '3 words that describe me in class:', type: 'short_answer', required: true },
      { id: 'q3', text: 'Favourite tiffin snack or lunch-break memory we shared:', type: 'paragraph', required: false },
      { id: 'q4', text: 'Write your classic farewell autograph message for my book:', type: 'paragraph', required: true },
    ],
  },
  {
    id: 'birthday',
    title: 'Birthday',
    badge: 'Celebration',
    tagline: 'Collect heartfelt birthday wishes & time-capsule predictions',
    description:
      'Turn any milestone birthday into a keepsake album filled with letters, toasts, and favourite memories from guests.',
    coverColor: '#FCF0C2',
    tapeClass: 'tape-sage',
    defaultQuestions: [
      { id: 'q1', text: 'Your name & how many years we have known each other:', type: 'short_answer', required: true },
      { id: 'q2', text: 'Your favourite memory of us from this past year:', type: 'paragraph', required: true },
      { id: 'q3', text: 'What is your biggest wish for my new chapter ahead?', type: 'paragraph', required: true },
    ],
  },
  {
    id: 'get-to-know-me',
    title: 'Get to know me',
    badge: 'Icebreaker',
    tagline: 'Fun, light-hearted prompts for new friends, clubs, and cohorts',
    description:
      'Great for freshers, creative communities, and group retreats where everyone shares their quirks and favourites.',
    coverColor: '#D5E8DA',
    tapeClass: 'tape-sage',
    defaultQuestions: [
      { id: 'q1', text: 'Your name and your go-to comfort movie or show:', type: 'short_answer', required: true },
      { id: 'q2', text: 'An unpopular opinion you will defend forever:', type: 'short_answer', required: false },
      { id: 'q3', text: 'What is something small that always makes your day better?', type: 'paragraph', required: true },
      { id: 'q4', text: 'If we could travel anywhere together tomorrow, where are we going?', type: 'short_answer', required: false },
    ],
  },
];

