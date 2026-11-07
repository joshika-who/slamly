/**
 * ============================================================================
 * SLAMLY — STARTER BOOK TEMPLATES
 * ============================================================================
 * Curated ready-made slam book templates for Friendship, College Memories,
 * School Farewell, Birthday, and Get to Know Me.
 * When a user creates a book from a template, questions are deep-copied into
 * their Firestore `books/{bookId}` document so future template edits never
 * alter existing user books.
 * ============================================================================
 */

export const BOOK_TEMPLATES = [
  {
    id: 'friendship',
    title: 'Friendship',
    badge: 'Most Popular',
    tagline: 'Classic slam book prompts for your closest friends',
    description:
      'Capture nicknames, first impressions, inside jokes, song dedications, and the moments you never want to forget.',
    coverColor: '#FAD2DD',
    coverTheme: 'pink',
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
    coverTheme: 'lavender',
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
    coverTheme: 'peach',
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
    coverTheme: 'peach',
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
    coverTheme: 'sage',
    tapeClass: 'tape-sage',
    defaultQuestions: [
      { id: 'q1', text: 'Your name and your go-to comfort movie or show:', type: 'short_answer', required: true },
      { id: 'q2', text: 'An unpopular opinion you will defend forever:', type: 'short_answer', required: false },
      { id: 'q3', text: 'What is something small that always makes your day better?', type: 'paragraph', required: true },
      { id: 'q4', text: 'If we could travel anywhere together tomorrow, where are we going?', type: 'short_answer', required: false },
    ],
  },
];
