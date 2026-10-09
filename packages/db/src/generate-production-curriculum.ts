import * as XLSX from 'xlsx';
import { INITIAL_SOURCE_RULES } from './initial-draft-rules';
import type {
  SourceRule,
  LessonContent,
  ReadingContent,
  ContentBundle,
} from '@phonologic/shared-types';

// Chuẩn hóa 30 âm trực tiếp từ cột Sound trong file Quy tắc.xlsx (không dùng ký hiệu IPA)
export const SOUND_TO_NOTATION_MAP: Record<string, { notation: string; viName: string; desc: string }> = {
  '/a/': { notation: '/a/', viName: 'Âm /a/', desc: 'như trong cat, apple, cash' },
  '/e/': { notation: '/e/', viName: 'Âm /e/', desc: 'như trong egg, health, said' },
  '/i/': { notation: '/i/', viName: 'Âm /i/', desc: 'như trong kid, sit, typical' },
  '/o/': { notation: '/o/', viName: 'Âm /o/', desc: 'như trong wrong, watch, option' },
  '/u/': { notation: '/u/', viName: 'Âm /u/', desc: 'như trong hug, money, young' },
  '/ai/': { notation: '/ai/', viName: 'Âm /ai/', desc: 'như trong train, steak, holiday' },
  '/ee/': { notation: '/ee/', viName: 'Âm /ee/', desc: 'như trong beach, three, piece' },
  '/igh/': { notation: '/igh/', viName: 'Âm /igh/', desc: 'như trong night, child, dry' },
  '/oa/': { notation: '/oa/', viName: 'Âm /oa/', desc: 'như trong goal, open, hope' },
  '/yoo/': { notation: '/yoo/', viName: 'Âm /yoo/', desc: 'như trong unique, value, huge' },
  '/oo(s)/': { notation: '/oo(s)/', viName: 'Âm /oo(s)/ (oo ngắn)', desc: 'như trong cook, look, put' },
  '/oo(l)/': { notation: '/oo(l)/', viName: 'Âm /oo(l)/ (oo dài)', desc: 'như trong food, glue, through' },
  '/oi/': { notation: '/oi/', viName: 'Âm /oi/', desc: 'như trong oil, coin, boy' },
  '/ou/': { notation: '/ou/', viName: 'Âm /ou/', desc: 'như trong owl, cloud, drought' },
  '/ar/': { notation: '/ar/', viName: 'Âm /ar/', desc: 'như trong garden, target, father' },
  '/or/': { notation: '/or/', viName: 'Âm /or/', desc: 'như trong daughter, author, port' },
  '/ur/': { notation: '/ur/', viName: 'Âm /ur/', desc: 'như trong letter, learn, girl' },
  '/oor/': { notation: '/oor/', viName: 'Âm /oor/', desc: 'như trong poor, tour, mature' },
  '/yoor/': { notation: '/yoor/', viName: 'Âm /yoor/', desc: 'như trong pure, cure, secure' },
  '/air/': { notation: '/air/', viName: 'Âm /air/', desc: 'như trong air, repair, nightmare' },
  '/b/': { notation: '/b/', viName: 'Phụ âm /b/', desc: 'như trong beer, bubble, build' },
  '/k/': { notation: '/k/', viName: 'Phụ âm /k/', desc: 'như trong skirt, black, camping' },
  '/d/': { notation: '/d/', viName: 'Phụ âm /d/', desc: 'như trong dragon, wedding, rained' },
  '/f/': { notation: '/f/', viName: 'Phụ âm /f/', desc: 'như trong funeral, effort, laugh' },
  '/g/': { notation: '/g/', viName: 'Phụ âm /g/', desc: 'như trong great, guide, ghost' },
  '/h/': { notation: '/h/', viName: 'Phụ âm /h/', desc: 'như trong horse, whole, hill' },
  '/j/': { notation: '/j/', viName: 'Phụ âm /j/', desc: 'như trong job, gem, bridge' },
  '/l/': { notation: '/l/', viName: 'Phụ âm /l/', desc: 'như trong life, language, climb' },
  '/ul/': { notation: '/ul/', viName: 'Âm /ul/ (đuôi le/el)', desc: 'như trong apple, people, battle' },
  '/m/': { notation: '/m/', viName: 'Phụ âm /m/', desc: 'như trong milk, summer, climb' },
};

// 155 quy tắc chuẩn từ Excel gốc, giữ nguyên nhãn âm gốc làm notation chính thức
export const PRODUCTION_RULES: SourceRule[] = INITIAL_SOURCE_RULES.map((r) => {
  const mapping = SOUND_TO_NOTATION_MAP[r.sourceLabel];
  const notation = mapping ? mapping.notation : r.sourceLabel;
  return {
    ...r,
    notation,
    status: 'approved' as const,
    note: mapping
      ? `${mapping.viName}: ${mapping.desc}. Tổ hợp '${r.pattern}'${r.condition ? ` (${r.condition})` : ''}.`
      : `Quy tắc chữ–âm cho tổ hợp '${r.pattern}'`,
  };
});

// Kho từ vựng đại diện tần suất cao
export interface VocabItem {
  word: string;
  meaningVi: string;
  pos: string;
  cefr: string;
  targetSound: string;
  targetPattern: string;
  segmentBreakdown: string;
  accent: 'US' | 'UK';
  sampleSentence: string;
}

export const PRODUCTION_VOCABULARY: VocabItem[] = [
  {
    word: 'daughter',
    meaningVi: 'con gái (ruột)',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/or/',
    targetPattern: 'augh',
    segmentBreakdown: 'd [/d/] | augh [/or/] | t [/t/] | er [/ur/]',
    accent: 'US',
    sampleSentence: 'My lovely daughter sat by the window.',
  },
  {
    word: 'letter',
    meaningVi: 'lá thư, bức thư',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/ur/',
    targetPattern: 'er',
    segmentBreakdown: 'l [/l/] | e [/e/] | tt [/t/] | er [/ur/]',
    accent: 'US',
    sampleSentence: 'She wrote a sweet letter to her grandparents.',
  },
  {
    word: 'steak',
    meaningVi: 'bít tết, miếng thịt bò',
    pos: 'noun',
    cefr: 'A2',
    targetSound: '/ai/',
    targetPattern: 'ea',
    segmentBreakdown: 'st [/s/] | ea [/ai/] | k [/k/]',
    accent: 'US',
    sampleSentence: 'A warm steak was served with fresh vegetables.',
  },
  {
    word: 'knight',
    meaningVi: 'hiệp sĩ',
    pos: 'noun',
    cefr: 'B1',
    targetSound: '/igh/',
    targetPattern: 'igh',
    segmentBreakdown: 'kn [/n/] | igh [/igh/] | t [/t/]',
    accent: 'US',
    sampleSentence: 'A brave knight walked through the deep forest.',
  },
  {
    word: 'night',
    meaningVi: 'ban đêm',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/igh/',
    targetPattern: 'igh',
    segmentBreakdown: 'n [/n/] | igh [/igh/] | t [/t/]',
    accent: 'US',
    sampleSentence: 'The stars shine brightly at night.',
  },
  {
    word: 'apple',
    meaningVi: 'quả táo',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/a/',
    targetPattern: 'a',
    segmentBreakdown: 'a [/a/] | pp [/p/] | le [/ul/]',
    accent: 'US',
    sampleSentence: 'He held a small apple in his bag.',
  },
  {
    word: 'bridge',
    meaningVi: 'cây cầu',
    pos: 'noun',
    cefr: 'A2',
    targetSound: '/j/',
    targetPattern: 'dge',
    segmentBreakdown: 'br [/b/] | i [/i/] | dge [/j/]',
    accent: 'US',
    sampleSentence: 'They crossed an ancient bridge over the river.',
  },
  {
    word: 'beach',
    meaningVi: 'bãi biển',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/ee/',
    targetPattern: 'ea',
    segmentBreakdown: 'b [/b/] | ea [/ee/] | ch [/ch/]',
    accent: 'US',
    sampleSentence: 'We walked along the sunny beach.',
  },
  {
    word: 'health',
    meaningVi: 'sức khỏe',
    pos: 'noun',
    cefr: 'A2',
    targetSound: '/e/',
    targetPattern: 'ea',
    segmentBreakdown: 'h [/h/] | ea [/e/] | lth [/lth/]',
    accent: 'US',
    sampleSentence: 'Good food is important for your health.',
  },
  {
    word: 'garden',
    meaningVi: 'khu vườn',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/ar/',
    targetPattern: 'ar',
    segmentBreakdown: 'g [/g/] | ar [/ar/] | d [/d/] | en [/en/]',
    accent: 'US',
    sampleSentence: 'The flowers in the garden are blooming.',
  },
  {
    word: 'gem',
    meaningVi: 'viên ngọc quý',
    pos: 'noun',
    cefr: 'B1',
    targetSound: '/j/',
    targetPattern: 'g',
    segmentBreakdown: 'g [/j/] | e [/e/] | m [/m/]',
    accent: 'US',
    sampleSentence: 'The royal crown was set with a shiny gem.',
  },
  {
    word: 'train',
    meaningVi: 'chuyến tàu hỏa',
    pos: 'noun',
    cefr: 'A1',
    targetSound: '/ai/',
    targetPattern: 'ai',
    segmentBreakdown: 'tr [/tr/] | ai [/ai/] | n [/n/]',
    accent: 'US',
    sampleSentence: 'The morning train arrived right on time.',
  },
];

// 6 bài học theo tiến trình sư phạm, hỗ trợ cả giọng US và UK
export const PRODUCTION_LESSONS: LessonContent[] = [
  {
    id: 'lesson-vowel-digraph-ea',
    title: 'Tổ hợp chữ "ea" & Tính đa âm vị',
    description: 'Khám phá chùm chữ đa âm nhất tiếng Anh: nhận diện khi nào "ea" đọc là /ee/, /e/ hay ngoại lệ /ai/.',
    accent: 'US',
    prerequisiteId: null,
    questions: [
      {
        id: 'q-ea-steak-word-sound',
        kind: 'word_sound',
        prompt: 'Trong từ "steak", tổ hợp chữ được gạch chân phát âm thành âm nào?',
        word: 'steak',
        meaning: 'miếng bít tết bò',
        notation: '/ai/',
        highlight: { start: 2, end: 4 },
        choices: [
          { id: 'c-sound-ai', label: '/ai/', description: 'như trong train, great, day' },
          { id: 'c-sound-ee', label: '/ee/', description: 'như trong beach, read, meal' },
          { id: 'c-sound-e', label: '/e/', description: 'như trong egg, health, head' },
          { id: 'c-sound-a', label: '/a/', description: 'như trong cat, cash' },
        ],
        correctIds: ['c-sound-ai'],
        multiple: false,
        ruleId: 'rule_row_26',
        explanation: 'Quy tắc vàng: Tổ hợp "ea" thông thường đọc là /ee/ (80%), nhưng trong 3 từ đặc biệt steak, great, break nó biến thành âm /ai/!',
      },
      {
        id: 'q-ea-spelling-sound',
        kind: 'spelling_sound',
        prompt: 'Tổ hợp chữ "ea" có thể phát âm thành những âm nào sau đây? (Chọn tất cả đáp án đúng)',
        notation: 'ea',
        choices: [
          { id: 'c-opt-ee', label: '/ee/', description: 'Ví dụ: beach, meal, read' },
          { id: 'c-opt-e', label: '/e/', description: 'Ví dụ: health, threat, weather' },
          { id: 'c-opt-ai', label: '/ai/', description: 'Ví dụ: steak, great, break' },
          { id: 'c-opt-u', label: '/u/', description: 'Không có cách đọc này' },
        ],
        correctIds: ['c-opt-ee', 'c-opt-e', 'c-opt-ai'],
        multiple: true,
        ruleId: 'rule_row_33',
        explanation: 'Chùm chữ "ea" đại diện cho 3 âm vị chính: /ee/ (beach), /e/ (health) và /ai/ (steak).',
      },
      {
        id: 'q-ea-sound-spelling',
        kind: 'sound_spelling',
        prompt: 'Âm /ai/ có thể được tạo thành từ những tổ hợp chữ nào sau đây? (Chọn tất cả)',
        notation: '/ai/',
        choices: [
          { id: 'c-pat-ai', label: 'ai', description: 'Ví dụ: train, maintain' },
          { id: 'c-pat-ay', label: 'ay', description: 'Ví dụ: array, holiday' },
          { id: 'c-pat-ea', label: 'ea', description: 'Ví dụ: steak, break' },
          { id: 'c-pat-a-e', label: 'a-e', description: 'Ví dụ: parade, persuade' },
        ],
        correctIds: ['c-pat-ai', 'c-pat-ay', 'c-pat-ea', 'c-pat-a-e'],
        multiple: true,
        ruleId: 'rule_row_21',
        explanation: 'Âm /ai/ có nhiều cách viết phong phú: ai, ay, a-e và trường hợp đặc biệt ea.',
      },
      {
        id: 'q-ea-sound-word',
        kind: 'sound_word',
        prompt: 'Từ nào dưới đây có chứa âm /ai/?',
        notation: '/ai/',
        word: 'steak',
        choices: [
          { id: 'c-word-steak', label: 'steak', description: 'Phát âm là âm /ai/' },
          { id: 'c-word-beach', label: 'beach', description: 'Phát âm là âm /ee/' },
          { id: 'c-word-head', label: 'head', description: 'Phát âm là âm /e/' },
          { id: 'c-word-eat', label: 'eat', description: 'Phát âm là âm /ee/' },
        ],
        correctIds: ['c-word-steak'],
        multiple: false,
        ruleId: 'rule_row_26',
        explanation: 'Chỉ có từ steak có phần "ea" phát âm thành âm /ai/.',
      },
      {
        id: 'q-ea-meaning',
        kind: 'meaning',
        prompt: 'Từ "steak" có nghĩa là gì?',
        word: 'steak',
        meaning: 'bít tết, miếng thịt bò',
        notation: '/ai/',
        segments: [
          { spelling: 'st', notation: '/s/', start: 0, end: 2 },
          { spelling: 'ea', notation: '/ai/', start: 2, end: 4 },
          { spelling: 'k', notation: '/k/', start: 4, end: 5 },
        ],
        choices: [
          { id: 'c-m-steak', label: 'Miếng thịt bò bít tết', description: 'Món ăn phương Tây' },
          { id: 'c-m-stick', label: 'Cây gậy gỗ', description: 'Nghĩa của từ stick' },
          { id: 'c-m-speak', label: 'Nói chuyện, phát biểu', description: 'Nghĩa của từ speak' },
          { id: 'c-m-smoke', label: 'Khói thuốc, làn khói', description: 'Nghĩa của từ smoke' },
        ],
        correctIds: ['c-m-steak'],
        multiple: false,
        ruleId: 'rule_row_26',
        explanation: 'Steak mang âm /ai/, nghĩa là bít tết bò.',
      },
      {
        id: 'q-ea-spelling',
        kind: 'spelling',
        prompt: 'Ghép các chữ cái để hoàn thiện từ "steak" (nghĩa: miếng bít tết):',
        word: 'steak',
        notation: '/ai/',
        choices: [
          { id: 'c-ch-s', label: 's' },
          { id: 'c-ch-t', label: 't' },
          { id: 'c-ch-e', label: 'e' },
          { id: 'c-ch-a', label: 'a' },
          { id: 'c-ch-k', label: 'k' },
        ],
        correctIds: ['c-ch-s'],
        multiple: false,
        ruleId: 'rule_row_26',
        explanation: 'Từ steak được cấu thành từ 5 chữ cái: s-t-e-a-k.',
      },
    ],
  },
  {
    id: 'lesson-augh-sound-or',
    title: 'Chùm ký tự "augh" & Âm /or/',
    description: 'Quy tắc nhận diện chùm chữ "augh" thường phát âm thành âm /or/ như trong daughter, caught, taught.',
    accent: 'US',
    prerequisiteId: 'lesson-vowel-digraph-ea',
    questions: [
      {
        id: 'q-augh-daughter-word-sound',
        kind: 'word_sound',
        prompt: 'Trong từ "daughter", chùm chữ "augh" phát âm thành âm nào?',
        word: 'daughter',
        meaning: 'con gái ruột',
        notation: '/or/',
        highlight: { start: 1, end: 5 },
        choices: [
          { id: 'c-or-sound', label: '/or/', description: 'như trong port, auto, author' },
          { id: 'c-a-sound', label: '/a/', description: 'như trong cat, cash' },
          { id: 'c-ur-sound', label: '/ur/', description: 'như trong bird, letter' },
          { id: 'c-f-sound', label: '/f/', description: 'như trong laughter (ngoại lệ)' },
        ],
        correctIds: ['c-or-sound'],
        multiple: false,
        ruleId: 'rule_row_93',
        explanation: 'Quy tắc chùm "augh": Đa số augh đọc là âm /or/ như trong daughter, caught, taught, haughty.',
      },
      {
        id: 'q-augh-sound-spelling',
        kind: 'sound_spelling',
        prompt: 'Âm /or/ có thể được tạo thành từ những tổ hợp chữ nào dưới đây?',
        notation: '/or/',
        choices: [
          { id: 'c-sp-or', label: 'or', description: 'Ví dụ: horror, afford' },
          { id: 'c-sp-augh', label: 'augh', description: 'Ví dụ: daughter, naughty' },
          { id: 'c-sp-aw', label: 'aw', description: 'Ví dụ: crawl, withdraw' },
          { id: 'c-sp-au', label: 'au', description: 'Ví dụ: author, auto' },
        ],
        correctIds: ['c-sp-or', 'c-sp-augh', 'c-sp-aw', 'c-sp-au'],
        multiple: true,
        ruleId: 'rule_row_84',
        explanation: 'Âm /or/ được tạo thành bởi các cách viết: or, augh, aw, au, oar, ore.',
      },
      {
        id: 'q-augh-daughter-meaning',
        kind: 'meaning',
        prompt: 'Chọn nghĩa đúng của từ "daughter":',
        word: 'daughter',
        meaning: 'con gái (ruột)',
        notation: '/or/',
        segments: [
          { spelling: 'd', notation: '/d/', start: 0, end: 1 },
          { spelling: 'augh', notation: '/or/', start: 1, end: 5 },
          { spelling: 't', notation: '/t/', start: 5, end: 6 },
          { spelling: 'er', notation: '/ur/', start: 6, end: 8 },
        ],
        choices: [
          { id: 'c-mean-daughter', label: 'Con gái (ruột)', description: 'Thành viên gia đình' },
          { id: 'c-mean-doctor', label: 'Bác sĩ', description: 'Nghề nghiệp y tế' },
          { id: 'c-mean-sister', label: 'Chị / em gái', description: 'Quan hệ anh chị em' },
          { id: 'c-mean-mother', label: 'Người mẹ', description: 'Quan hệ mẫu tử' },
        ],
        correctIds: ['c-mean-daughter'],
        multiple: false,
        ruleId: 'rule_row_93',
        explanation: 'Daughter có nghĩa là con gái ruột trong gia đình.',
      },
      {
        id: 'q-augh-daughter-spelling',
        kind: 'spelling',
        prompt: 'Ghép từ "daughter" từ kho ký tự:',
        word: 'daughter',
        notation: '/or/',
        choices: [
          { id: 'c-d', label: 'd' },
          { id: 'c-a', label: 'a' },
          { id: 'c-u', label: 'u' },
          { id: 'c-g', label: 'g' },
          { id: 'c-h', label: 'h' },
          { id: 'c-t', label: 't' },
          { id: 'c-e', label: 'e' },
          { id: 'c-r', label: 'r' },
        ],
        correctIds: ['c-d'],
        multiple: false,
        ruleId: 'rule_row_93',
        explanation: 'Daughter được đánh vần là d-a-u-g-h-t-e-r.',
      },
      {
        id: 'q-augh-sound-word',
        kind: 'sound_word',
        prompt: 'Từ nào sau đây có chứa âm /or/ từ chùm chữ "augh"?',
        notation: '/or/',
        word: 'daughter',
        choices: [
          { id: 'c-sw-daughter', label: 'daughter', description: 'augh phát âm thành /or/' },
          { id: 'c-sw-laugh', label: 'laugh', description: 'augh phát âm thành /ar/ /f/ (ngoại lệ)' },
          { id: 'c-sw-letter', label: 'letter', description: 'chứa âm /e/ và /ur/' },
          { id: 'c-sw-cat', label: 'cat', description: 'chứa âm /a/' },
        ],
        correctIds: ['c-sw-daughter'],
        multiple: false,
        ruleId: 'rule_row_93',
        explanation: 'Daughter có chùm augh phát âm thành âm /or/.',
      },
      {
        id: 'q-augh-spelling-sound',
        kind: 'spelling_sound',
        prompt: 'Chùm ký tự "augh" thường phát âm thành âm nào trong các từ daughter, caught, taught?',
        notation: 'augh',
        choices: [
          { id: 'c-ss-or', label: '/or/', description: 'Âm chuẩn thông dụng nhất' },
          { id: 'c-ss-ai', label: '/ai/', description: 'Không chính xác' },
          { id: 'c-ss-a', label: '/a/', description: 'Không chính xác' },
        ],
        correctIds: ['c-ss-or'],
        multiple: false,
        ruleId: 'rule_row_93',
        explanation: 'augh thường phát âm là âm /or/.',
      },
    ],
  },
  {
    id: 'lesson-short-vowels-a-e',
    title: 'Nguyên âm ngắn /a/ và /e/',
    description: 'Nắm vững quy tắc âm /a/ trong cat, apple và âm /e/ trong egg, health, said.',
    accent: 'US',
    prerequisiteId: 'lesson-augh-sound-or',
    questions: [
      {
        id: 'q-short-a-cat',
        kind: 'word_sound',
        prompt: 'Trong từ "apple", chữ "a" đầu tiên phát âm thành âm gì?',
        word: 'apple',
        meaning: 'quả táo',
        notation: '/a/',
        highlight: { start: 0, end: 1 },
        choices: [
          { id: 'c-sa-a', label: '/a/', description: 'như trong cat, cash, bat' },
          { id: 'c-sa-ai', label: '/ai/', description: 'như trong train, steak' },
          { id: 'c-sa-e', label: '/e/', description: 'như trong egg, jet' },
        ],
        correctIds: ['c-sa-a'],
        multiple: false,
        ruleId: 'rule_row_4',
        explanation: 'Chữ a trước đuôi le tạo thành âm /a/ như trong apple, candle, battle.',
      },
      {
        id: 'q-short-vowel-spelling',
        kind: 'sound_spelling',
        prompt: 'Những từ hoặc tổ hợp nào dưới đây tạo ra âm /e/?',
        notation: '/e/',
        choices: [
          { id: 'c-se-e', label: 'e trong egg, jet', description: 'Quy tắc phổ biến nhất' },
          { id: 'c-se-ea', label: 'ea trong health, weather', description: 'Quy tắc tổ hợp ea' },
          { id: 'c-se-ai', label: 'ai trong said, against', description: 'Ngoại lệ thông dụng' },
          { id: 'c-se-ee', label: 'ee trong three', description: 'Phát âm là /ee/' },
        ],
        correctIds: ['c-se-e', 'c-se-ea', 'c-se-ai'],
        multiple: true,
        ruleId: 'rule_row_6',
        explanation: 'Âm /e/ có thể xuất phát từ chữ e đơn, ea hoặc ai (said).',
      },
      {
        id: 'q-short-apple-meaning',
        kind: 'meaning',
        prompt: 'Chọn nghĩa đúng của từ "apple":',
        word: 'apple',
        meaning: 'quả táo',
        notation: '/a/',
        segments: [
          { spelling: 'a', notation: '/a/', start: 0, end: 1 },
          { spelling: 'pp', notation: '/p/', start: 1, end: 3 },
          { spelling: 'le', notation: '/ul/', start: 3, end: 5 },
        ],
        choices: [
          { id: 'c-m-apple', label: 'Quả táo', description: 'Loại trái cây ngọt giòn' },
          { id: 'c-m-orange', label: 'Quả cam', description: 'Trái cây họ cam quýt' },
          { id: 'c-m-banana', label: 'Quả chuối', description: 'Trái cây nhiệt đới' },
        ],
        correctIds: ['c-m-apple'],
        multiple: false,
        ruleId: 'rule_row_4',
        explanation: 'Apple nghĩa là quả táo.',
      },
      {
        id: 'q-short-apple-spell',
        kind: 'spelling',
        prompt: 'Ghép từ "apple" từ các chữ cái:',
        word: 'apple',
        notation: '/a/',
        choices: [
          { id: 'c-ap-a', label: 'a' },
          { id: 'c-ap-p1', label: 'p' },
          { id: 'c-ap-p2', label: 'p' },
          { id: 'c-ap-l', label: 'l' },
          { id: 'c-ap-e', label: 'e' },
        ],
        correctIds: ['c-ap-a'],
        multiple: false,
        ruleId: 'rule_row_4',
        explanation: 'Apple gồm 5 chữ cái: a-p-p-l-e.',
      },
    ],
  },
  {
    id: 'lesson-r-controlled-vowels',
    title: 'Nguyên âm biến đổi theo "R" (/ar/, /or/, /ur/)',
    description: 'Quy tắc các nguyên âm kết hợp với âm R tạo ra âm thanh sâu và ngân dài đặc trưng.',
    accent: 'US',
    prerequisiteId: 'lesson-short-vowels-a-e',
    questions: [
      {
        id: 'q-rc-letter-word-sound',
        kind: 'word_sound',
        prompt: 'Trong từ "letter", đuôi "er" phát âm thành âm gì?',
        word: 'letter',
        meaning: 'lá thư',
        notation: '/ur/',
        highlight: { start: 4, end: 6 },
        choices: [
          { id: 'c-ur-correct', label: '/ur/', description: 'như trong letter, bird, girl' },
          { id: 'c-ar-choice', label: '/ar/', description: 'như trong garden, art' },
          { id: 'c-or-choice', label: '/or/', description: 'như trong daughter, port' },
        ],
        correctIds: ['c-ur-correct'],
        multiple: false,
        ruleId: 'rule_row_100',
        explanation: 'Đuôi er không mang trọng âm phát âm thành âm /ur/ như trong letter, exercise, computer.',
      },
      {
        id: 'q-rc-letter-meaning',
        kind: 'meaning',
        prompt: 'Chọn nghĩa đúng của từ "letter":',
        word: 'letter',
        meaning: 'lá thư, ký tự chữ cái',
        notation: '/ur/',
        segments: [
          { spelling: 'l', notation: '/l/', start: 0, end: 1 },
          { spelling: 'e', notation: '/e/', start: 1, end: 2 },
          { spelling: 'tt', notation: '/t/', start: 2, end: 4 },
          { spelling: 'er', notation: '/ur/', start: 4, end: 6 },
        ],
        choices: [
          { id: 'c-m-letter', label: 'Lá thư hoặc chữ cái', description: 'Bức thư gửi cho người khác' },
          { id: 'c-m-ladder', label: 'Cái thang leo', description: 'Dụng cụ leo trèo' },
          { id: 'c-m-latter', label: 'Cái phía sau / người sau', description: 'Chỉ thứ tự sau' },
        ],
        correctIds: ['c-m-letter'],
        multiple: false,
        ruleId: 'rule_row_100',
        explanation: 'Letter có nghĩa là lá thư hoặc chữ cái.',
      },
      {
        id: 'q-rc-letter-spelling',
        kind: 'spelling',
        prompt: 'Ghép từ "letter":',
        word: 'letter',
        notation: '/ur/',
        choices: [
          { id: 'c-lt-l', label: 'l' },
          { id: 'c-lt-e', label: 'e' },
          { id: 'c-lt-t1', label: 't' },
          { id: 'c-lt-t2', label: 't' },
          { id: 'c-lt-e2', label: 'e' },
          { id: 'c-lt-r', label: 'r' },
        ],
        correctIds: ['c-lt-l'],
        multiple: false,
        ruleId: 'rule_row_100',
        explanation: 'Letter gồm 6 chữ cái: l-e-t-t-e-r.',
      },
      {
        id: 'q-rc-garden-sound-spelling',
        kind: 'sound_spelling',
        prompt: 'Âm /ar/ có trong những từ nào sau đây?',
        notation: '/ar/',
        choices: [
          { id: 'c-ar-garden', label: 'garden', description: 'Chứa tổ hợp ar' },
          { id: 'c-ar-target', label: 'target', description: 'Chứa tổ hợp ar' },
          { id: 'c-ar-father', label: 'father', description: 'Chứa chữ a phát âm là /ar/' },
          { id: 'c-ar-letter', label: 'letter', description: 'Chứa âm /ur/' },
        ],
        correctIds: ['c-ar-garden', 'c-ar-target', 'c-ar-father'],
        multiple: true,
        ruleId: 'rule_row_79',
        explanation: 'Garden, target và father đều chứa âm /ar/.',
      },
    ],
  },
  {
    id: 'lesson-consonant-clusters-c-k-g-j',
    title: 'Phụ âm cứng & mềm (c/k, g/j)',
    description: 'Quy tắc phân biệt âm C cứng / C mềm và âm G cứng / G mềm trước các nguyên âm e, i, y.',
    accent: 'US',
    prerequisiteId: 'lesson-r-controlled-vowels',
    questions: [
      {
        id: 'q-con-bridge-word-sound',
        kind: 'word_sound',
        prompt: 'Trong từ "bridge", đuôi "dge" phát âm thành âm gì?',
        word: 'bridge',
        meaning: 'cây cầu',
        notation: '/j/',
        highlight: { start: 3, end: 6 },
        choices: [
          { id: 'c-j-sound', label: '/j/', description: 'như trong job, gem, ginger' },
          { id: 'c-g-hard', label: '/g/', description: 'như trong great, get' },
          { id: 'c-d-sound', label: '/d/', description: 'như trong dragon, day' },
        ],
        correctIds: ['c-j-sound'],
        multiple: false,
        ruleId: 'rule_row_144',
        explanation: 'Đuôi "dge" luôn phát âm thành âm /j/ như trong bridge, knowledge, porridge.',
      },
      {
        id: 'q-con-soft-g-sound-spelling',
        kind: 'sound_spelling',
        prompt: 'Chữ "g" phát âm thành âm /j/ (G mềm) khi đứng trước những nguyên âm nào?',
        notation: '/j/',
        choices: [
          { id: 'c-g-before-e', label: 'g đứng trước e (ví dụ: gem, gene)', description: 'Quy tắc G mềm' },
          { id: 'c-g-before-i', label: 'g đứng trước i (ví dụ: giant, ginger)', description: 'Quy tắc G mềm' },
          { id: 'c-g-before-y', label: 'g đứng trước y (ví dụ: gym, biology)', description: 'Quy tắc G mềm' },
          { id: 'c-g-before-a', label: 'g đứng trước a (ví dụ: garden)', description: 'Phát âm là G cứng /g/' },
        ],
        correctIds: ['c-g-before-e', 'c-g-before-i', 'c-g-before-y'],
        multiple: true,
        ruleId: 'rule_row_141',
        explanation: 'Quy tắc vàng: G đứng trước e, i, y thường biến thành âm G mềm (âm /j/).',
      },
      {
        id: 'q-con-bridge-meaning',
        kind: 'meaning',
        prompt: 'Chọn nghĩa đúng của từ "bridge":',
        word: 'bridge',
        meaning: 'cây cầu',
        notation: '/j/',
        segments: [
          { spelling: 'br', notation: '/b/', start: 0, end: 2 },
          { spelling: 'i', notation: '/i/', start: 2, end: 3 },
          { spelling: 'dge', notation: '/j/', start: 3, end: 6 },
        ],
        choices: [
          { id: 'c-mb-bridge', label: 'Cây cầu bắc qua sông', description: 'Công trình giao thông' },
          { id: 'c-mb-ridge', label: 'Dãy núi, sống núi', description: 'Địa hình tự nhiên' },
          { id: 'c-mb-badge', label: 'Huy hiệu, phù hiệu', description: 'Vật phẩm cài áo' },
        ],
        correctIds: ['c-mb-bridge'],
        multiple: false,
        ruleId: 'rule_row_144',
        explanation: 'Bridge có nghĩa là cây cầu.',
      },
      {
        id: 'q-con-bridge-spelling',
        kind: 'spelling',
        prompt: 'Ghép từ "bridge":',
        word: 'bridge',
        notation: '/j/',
        choices: [
          { id: 'c-bg-b', label: 'b' },
          { id: 'c-bg-r', label: 'r' },
          { id: 'c-bg-i', label: 'i' },
          { id: 'c-bg-d', label: 'd' },
          { id: 'c-bg-g', label: 'g' },
          { id: 'c-bg-e', label: 'e' },
        ],
        correctIds: ['c-bg-b'],
        multiple: false,
        ruleId: 'rule_row_144',
        explanation: 'Bridge được đánh vần là b-r-i-d-g-e.',
      },
    ],
  },
  {
    id: 'lesson-magic-e-long-vowels',
    title: 'Quy tắc Magic-E & Âm /igh/',
    description: 'Nắm vững quy tắc âm dài khi có chữ "e" câm ở cuối từ và tổ hợp igh.',
    accent: 'US',
    prerequisiteId: 'lesson-consonant-clusters-c-k-g-j',
    questions: [
      {
        id: 'q-me-night-word-sound',
        kind: 'word_sound',
        prompt: 'Trong từ "knight", tổ hợp chữ "igh" phát âm thành âm gì?',
        word: 'knight',
        meaning: 'hiệp sĩ',
        notation: '/igh/',
        highlight: { start: 2, end: 5 },
        choices: [
          { id: 'c-li-correct', label: '/igh/', description: 'như trong night, tie, dry' },
          { id: 'c-li-short-i', label: '/i/', description: 'như trong kid, sit' },
          { id: 'c-li-long-e', label: '/ee/', description: 'như trong piece, read' },
        ],
        correctIds: ['c-li-correct'],
        multiple: false,
        ruleId: 'rule_row_40',
        explanation: 'Tổ hợp igh luôn phát âm thành âm /igh/ như trong knight, night, bright, flight.',
      },
      {
        id: 'q-me-knight-meaning',
        kind: 'meaning',
        prompt: 'Từ "knight" có nghĩa là gì?',
        word: 'knight',
        meaning: 'hiệp sĩ thời trung cổ',
        notation: '/igh/',
        segments: [
          { spelling: 'kn', notation: '/n/', start: 0, end: 2 },
          { spelling: 'igh', notation: '/igh/', start: 2, end: 5 },
          { spelling: 't', notation: '/t/', start: 5, end: 6 },
        ],
        choices: [
          { id: 'c-mk-knight', label: 'Hiệp sĩ dũng cảm', description: 'Chiến binh danh dự thời trung cổ' },
          { id: 'c-mk-night', label: 'Ban đêm (đồng âm khác nghĩa)', description: 'Khoảng thời gian trời tối' },
          { id: 'c-mk-king', label: 'Vị vua, quân vương', description: 'Người trị vì vương quốc' },
        ],
        correctIds: ['c-mk-knight'],
        multiple: false,
        ruleId: 'rule_row_40',
        explanation: 'Knight có chữ k câm (kn đọc là /n/), nghĩa là hiệp sĩ.',
      },
      {
        id: 'q-me-knight-spelling',
        kind: 'spelling',
        prompt: 'Ghép từ "knight":',
        word: 'knight',
        notation: '/igh/',
        choices: [
          { id: 'c-kn-k', label: 'k' },
          { id: 'c-kn-n', label: 'n' },
          { id: 'c-kn-i', label: 'i' },
          { id: 'c-kn-g', label: 'g' },
          { id: 'c-kn-h', label: 'h' },
          { id: 'c-kn-t', label: 't' },
        ],
        correctIds: ['c-kn-k'],
        multiple: false,
        ruleId: 'rule_row_40',
        explanation: 'Knight gồm 6 chữ cái: k-n-i-g-h-t.',
      },
    ],
  },
];

// Bài đọc theo ngữ cảnh thực tế (hỗ trợ cả US và UK)
export const PRODUCTION_READINGS: ReadingContent[] = [
  {
    id: 'reading-family-dinner',
    title: 'A Cozy Evening at the Seaside',
    description: 'Đọc câu chuyện ấm áp về một buổi tối bên bờ biển, rèn luyện các từ chứa âm /or/, /ur/, /ai/ và các tổ hợp đặc thù.',
    level: 'A1',
    accent: 'US',
    text: 'My lovely daughter sat by the window, writing a sweet letter to her grandparents. On the wooden table, a warm steak was served with fresh vegetables. Outside, we could hear the calm waves of the sea.',
    targets: [
      {
        id: 'tgt-daughter',
        word: 'daughter',
        meaning: 'con gái (ruột)',
        start: 10,
        end: 18,
        segments: [
          { spelling: 'd', notation: '/d/', start: 0, end: 1 },
          { spelling: 'augh', notation: '/or/', start: 1, end: 5 },
          { spelling: 't', notation: '/t/', start: 5, end: 6 },
          { spelling: 'er', notation: '/ur/', start: 6, end: 8 },
        ],
      },
      {
        id: 'tgt-letter',
        word: 'letter',
        meaning: 'lá thư',
        start: 54,
        end: 60,
        segments: [
          { spelling: 'l', notation: '/l/', start: 0, end: 1 },
          { spelling: 'e', notation: '/e/', start: 1, end: 2 },
          { spelling: 'tt', notation: '/t/', start: 2, end: 4 },
          { spelling: 'er', notation: '/ur/', start: 4, end: 6 },
        ],
      },
      {
        id: 'tgt-steak',
        word: 'steak',
        meaning: 'bít tết bò',
        start: 110,
        end: 115,
        segments: [
          { spelling: 'st', notation: '/s/', start: 0, end: 2 },
          { spelling: 'ea', notation: '/ai/', start: 2, end: 4 },
          { spelling: 'k', notation: '/k/', start: 4, end: 5 },
        ],
      },
      {
        id: 'tgt-waves',
        word: 'waves',
        meaning: 'những con sóng',
        start: 182,
        end: 187,
        segments: [
          { spelling: 'w', notation: '/w/', start: 0, end: 1 },
          { spelling: 'a', notation: '/ai/', start: 1, end: 2 },
          { spelling: 'v', notation: '/v/', start: 2, end: 3 },
          { spelling: 'es', notation: '/z/', start: 3, end: 5 },
        ],
      },
    ],
  },
  {
    id: 'reading-little-explorer',
    title: "The Young Knight's Journey",
    description: 'Chuyến hành trình kỳ thú của chàng hiệp sĩ trẻ qua khu rừng đêm đến cây cầu cổ tích.',
    level: 'A2',
    accent: 'UK',
    text: 'A brave knight walked through the deep green forest at night. He held a small apple in his bag and followed a bright star in the sky to find the ancient bridge.',
    targets: [
      {
        id: 'tgt-knight',
        word: 'knight',
        meaning: 'hiệp sĩ',
        start: 8,
        end: 14,
        segments: [
          { spelling: 'kn', notation: '/n/', start: 0, end: 2 },
          { spelling: 'igh', notation: '/igh/', start: 2, end: 5 },
          { spelling: 't', notation: '/t/', start: 5, end: 6 },
        ],
      },
      {
        id: 'tgt-night',
        word: 'night',
        meaning: 'ban đêm',
        start: 55,
        end: 60,
        segments: [
          { spelling: 'n', notation: '/n/', start: 0, end: 1 },
          { spelling: 'igh', notation: '/igh/', start: 1, end: 4 },
          { spelling: 't', notation: '/t/', start: 4, end: 5 },
        ],
      },
      {
        id: 'tgt-apple',
        word: 'apple',
        meaning: 'quả táo',
        start: 78,
        end: 83,
        segments: [
          { spelling: 'a', notation: '/a/', start: 0, end: 1 },
          { spelling: 'pp', notation: '/p/', start: 1, end: 3 },
          { spelling: 'le', notation: '/ul/', start: 3, end: 5 },
        ],
      },
      {
        id: 'tgt-bridge',
        word: 'bridge',
        meaning: 'cây cầu',
        start: 153,
        end: 159,
        segments: [
          { spelling: 'br', notation: '/b/', start: 0, end: 2 },
          { spelling: 'i', notation: '/i/', start: 2, end: 3 },
          { spelling: 'dge', notation: '/j/', start: 3, end: 6 },
        ],
      },
    ],
  },
];

// Production Content Bundle
export const PRODUCTION_CONTENT_BUNDLE: ContentBundle = {
  notationVersion: '2026.10-excel-exact-v2',
  notationConfirmed: true,
  rules: PRODUCTION_RULES,
  lessons: PRODUCTION_LESSONS,
  readings: PRODUCTION_READINGS,
};

// Strongly-typed question row for Excel export
interface QuestionExcelRow {
  'Question ID': string;
  'Lesson ID': string;
  'Question Kind': string;
  'Prompt': string;
  'Word': string;
  'Target Notation': string;
  'Multiple Choice': string;
  'Rule ID': string;
  'Choices (JSON)': string;
  'Correct IDs (JSON)': string;
  'Explanation': string;
}

// Hàm ghi file Excel 6 sheets chuẩn theo đúng bảng âm gốc
export async function buildMultiSheetExcel(outputPath: string): Promise<void> {
  const wb = XLSX.utils.book_new();

  // 1. SourceRules_155
  const rulesRows = PRODUCTION_RULES.map((r) => ({
    'ID': r.id,
    'Source Row': r.sourceRow,
    'Sound (Excel)': r.sourceLabel,
    'Pattern': r.pattern,
    'Condition': r.condition || '',
    'Examples': r.examples.join(', '),
    'Custom Notation': r.notation,
    'Status': r.status,
    'Pedagogical Note': r.note || '',
  }));
  const wsRules = XLSX.utils.json_to_sheet(rulesRows);
  wsRules['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 26 },
    { wch: 40 },
    { wch: 18 },
    { wch: 14 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRules, 'SourceRules_155');

  // 2. Vocabulary_Bank
  const vocabRows = PRODUCTION_VOCABULARY.map((v) => ({
    'Word': v.word,
    'Vietnamese Meaning': v.meaningVi,
    'Part of Speech': v.pos,
    'CEFR': v.cefr,
    'Target Sound': v.targetSound,
    'Target Pattern': v.targetPattern,
    'Phonetic Segments': v.segmentBreakdown,
    'Accent': v.accent,
    'Sample Sentence': v.sampleSentence,
  }));
  const wsVocab = XLSX.utils.json_to_sheet(vocabRows);
  wsVocab['!cols'] = [
    { wch: 16 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 40 },
    { wch: 10 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVocab, 'Vocabulary_Bank');

  // 3. Curriculum_Lessons
  const lessonRows = PRODUCTION_LESSONS.map((l) => ({
    'Lesson ID': l.id,
    'Title': l.title,
    'Description': l.description,
    'Accent': l.accent,
    'Prerequisite ID': l.prerequisiteId || '(Root lesson)',
    'Questions Count': l.questions.length,
  }));
  const wsLessons = XLSX.utils.json_to_sheet(lessonRows);
  wsLessons['!cols'] = [
    { wch: 34 },
    { wch: 40 },
    { wch: 60 },
    { wch: 10 },
    { wch: 34 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLessons, 'Curriculum_Lessons');

  // 4. Question_Bank_6Types
  const questionRows: QuestionExcelRow[] = [];
  for (const l of PRODUCTION_LESSONS) {
    for (const q of l.questions) {
      questionRows.push({
        'Question ID': q.id,
        'Lesson ID': l.id,
        'Question Kind': q.kind,
        'Prompt': q.prompt,
        'Word': q.word || '',
        'Target Notation': q.notation || '',
        'Multiple Choice': q.multiple ? 'YES' : 'NO',
        'Rule ID': q.ruleId || '',
        'Choices (JSON)': JSON.stringify(q.choices),
        'Correct IDs (JSON)': JSON.stringify(q.correctIds),
        'Explanation': q.explanation || '',
      });
    }
  }
  const wsQuestions = XLSX.utils.json_to_sheet(questionRows);
  wsQuestions['!cols'] = [
    { wch: 30 },
    { wch: 32 },
    { wch: 18 },
    { wch: 55 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 50 },
    { wch: 25 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Question_Bank_6Types');

  // 5. Reading_Passages
  const readingRows = PRODUCTION_READINGS.map((r) => ({
    'Reading ID': r.id,
    'Title': r.title,
    'Level': r.level,
    'Accent': r.accent,
    'Full Passage Text': r.text,
    'Target Words Count': r.targets.length,
    'Target Words Breakdown (JSON)': JSON.stringify(r.targets),
  }));
  const wsReadings = XLSX.utils.json_to_sheet(readingRows);
  wsReadings['!cols'] = [
    { wch: 28 },
    { wch: 35 },
    { wch: 10 },
    { wch: 10 },
    { wch: 75 },
    { wch: 18 },
    { wch: 65 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReadings, 'Reading_Passages');

  // 6. Phonetic_Notation_Guide
  const guideRows = Object.entries(SOUND_TO_NOTATION_MAP).map(([sound, info]) => ({
    'Excel Sound Label': sound,
    'Custom Notation': info.notation,
    'Vietnamese Label': info.viName,
    'Phonetic Description': info.desc,
  }));
  const wsGuide = XLSX.utils.json_to_sheet(guideRows);
  wsGuide['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 35 },
    { wch: 65 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Phonetic_Notation_Guide');

  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Đã xuất bản file Excel chuẩn 6 sheets: ${outputPath}`);
}
