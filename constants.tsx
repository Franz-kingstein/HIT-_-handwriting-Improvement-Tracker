
import React from 'react';

export const SENTENCE_PROMPTS = [
  "Pack my box with five dozen liquor jugs.",
  "The quick brown fox jumps over the lazy dog.",
  "Always close the tops of your letters 'a' and 'o'.",
  "Quality and precision require patience and practice.",
  "A slight slant of five to fifteen degrees is ideal.",
  "Tall ascenders like 'd' and 'l' should be distinct.",
  "Keep your descenders like 'p' and 'q' tidy and long.",
  "Consistency across the baseline creates harmony."
];

export const PARAGRAPH_PROMPTS = [
  "Handwriting is an intimate expression of your personality and discipline. It is a craft that requires a steady hand and a calm mind to execute effectively. As you begin each word, focus on the deliberate connection between each letter, ensuring that the tops of your 'a' and 'o' are fully closed to avoid any confusion with 'u' or 'v'. Consistency across the baseline is the foundation of a readable script. By maintaining a uniform height for your letters and an even slant throughout the page, you create a visual harmony that is both pleasing and professional.",
  "The beauty of cursive writing lies in its continuous flow, which mirrors the fluidity of human thought. To achieve a high standard of penmanship, one must pay close attention to the small details that often go overlooked. Ensure that your ascenders reach upward with grace, while your descenders remain tidy and well-defined below the line. This separation prevents the unsightly tangling of characters between lines of text. A subtle slant of approximately ten degrees will lend your writing a sophisticated air of elegance. Remember that your pen is a tool for art as much as for communication.",
  "Developing a refined handwriting style is a journey that rewards those who practice with intention and regularity. It is not merely about speed, but about the quality of every individual stroke you make. When transitioning from block letters to cursive, maintain the same level of care for letter spacing and character sizing. If you find your writing becoming messy during faster dictation, slow down and revisit the basics of letter formation. Each session is an opportunity to improve your focus and fine-tune the mechanical movements of your hand. Persistence will eventually lead to effortless mastery of the script."
];

export const HANDWRITING_PROMPTS = [...SENTENCE_PROMPTS]; // Legacy export for backward compatibility

export const HANDWRITING_TIPS = [
  {
    title: "Clear Letters",
    desc: "Close the tops of 'a' and 'o'. Ensure 'd', 'l', 'p', and 'q' have distinct lengths.",
    icon: "🖋️"
  },
  {
    title: "Consistency",
    desc: "Maintain a steady baseline and keep similar letters the same size.",
    icon: "📏"
  },
  {
    title: "Avoid Tangles",
    desc: "Give your ascenders and descenders enough breathing room between lines.",
    icon: "✂️"
  },
  {
    title: "Tidy Connections",
    desc: "Use straight connectors in cursive; avoid connecting letters when printing.",
    icon: "🔗"
  },
  {
    title: "Perfect Slant",
    desc: "Aim for a subtle 5-15 degree slant. Tilt your paper to help consistency.",
    icon: "📐"
  }
];

export const ICONS = {
  Home: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Camera: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  History: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Templates: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};
