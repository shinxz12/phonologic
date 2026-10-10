import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { api } from '../../lib/api';
import { convertBlobTo16kHzWav } from './wavUtils';

export interface AzurePronunciationResult {
  score: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  transcript: string;
  phonemes: Array<{
    phoneme: string;
    accuracyScore: number;
  }>;
}

export interface AzurePassageWordResult {
  word: string;
  accuracyScore: number;
  errorType: 'None' | 'Mispronunciation' | 'Omission' | 'Insertion';
}

export interface AzurePassageResult {
  score: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  transcript: string;
  words: AzurePassageWordResult[];
}

/**
 * Chấm điểm phát âm từ đơn lẻ (Single Word)
 * Áp dụng thuật toán siết chặt (Strict Phoneme Penalty) và loại bỏ yếu tố Fluency (trôi chảy)
 */
export async function assessPronunciationAzure(
  audioBlob: Blob,
  targetWord: string,
  accent: 'US' | 'UK' = 'US'
): Promise<AzurePronunciationResult> {
  const { promise, resolve, reject } = Promise.withResolvers<AzurePronunciationResult>();

  try {
    const { token, region } = await api<{ token: string; region: string }>('/learning/speech-token');
    
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = accent === 'UK' ? 'en-GB' : 'en-US';

    const wavBlob = await convertBlobTo16kHzWav(audioBlob);
    const file = new File([wavBlob], 'audio.wav', { type: 'audio/wav' });
    const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(file);

    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      targetWord,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme
    );

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync(
      (result: SpeechSDK.SpeechRecognitionResult) => {
        recognizer.close();

        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const pronunciationResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
          let phonemes: Array<{ phoneme: string; accuracyScore: number }> = [];
          try {
            const jsonStr = result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult);
            if (jsonStr) {
              const json = JSON.parse(jsonStr);
              const words = json.NBest?.[0]?.Words || [];
              for (const w of words) {
                if (w.Phonemes) {
                  for (const p of w.Phonemes) {
                    phonemes.push({
                      phoneme: p.Phoneme,
                      accuracyScore: Math.round(p.PronunciationAssessment?.AccuracyScore ?? 0),
                    });
                  }
                }
              }
            }
          } catch {
            // fallback
          }

          // THUẬT TOÁN SIẾT CHẶT CHO TỪ ĐƠN (LOẠI BỎ FLUENCY, PHẠT NẶNG ÂM YẾU)
          let strictScore = pronunciationResult.accuracyScore;
          if (phonemes.length > 0) {
            const minPhoneme = Math.min(...phonemes.map((p) => p.accuracyScore));
            const avgPhoneme = phonemes.reduce((sum, p) => sum + p.accuracyScore, 0) / phonemes.length;
            
            // Nếu có âm tiết nào đọc sai nghiêm trọng (< 65 điểm), điểm tổng bị kéo tụt xuống
            if (minPhoneme < 65) {
              strictScore = Math.round(avgPhoneme * 0.4 + minPhoneme * 0.6);
            } else {
              strictScore = Math.round(avgPhoneme * 0.7 + minPhoneme * 0.3);
            }
          }

          resolve({
            score: Math.min(100, Math.max(0, strictScore)),
            accuracyScore: pronunciationResult.accuracyScore,
            fluencyScore: pronunciationResult.fluencyScore,
            completenessScore: pronunciationResult.completenessScore,
            transcript: result.text,
            phonemes,
          });
        } else {
          reject(new Error('Không thể nhận diện giọng nói. Lỗi: ' + (result.errorDetails || 'Âm thanh không rõ')));
        }
      },
      (err) => {
        recognizer.close();
        reject(err);
      }
    );
  } catch (err) {
    reject(err);
  }

  return promise;
}

/**
 * Chấm điểm phát âm cả đoạn văn (Paragraph / Passage Reading)
 * Giữ nguyên Fluency, Completeness và hiển thị bắt lỗi từng từ
 */
export async function assessPassageAzure(
  audioBlob: Blob,
  passageText: string,
  accent: 'US' | 'UK' = 'US'
): Promise<AzurePassageResult> {
  const { promise, resolve, reject } = Promise.withResolvers<AzurePassageResult>();

  try {
    const { token, region } = await api<{ token: string; region: string }>('/learning/speech-token');

    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = accent === 'UK' ? 'en-GB' : 'en-US';

    const wavBlob = await convertBlobTo16kHzWav(audioBlob);
    const file = new File([wavBlob], 'audio.wav', { type: 'audio/wav' });
    const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(file);

    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      passageText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Word
    );

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync(
      (result: SpeechSDK.SpeechRecognitionResult) => {
        recognizer.close();

        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const pronunciationResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
          const words: AzurePassageWordResult[] = [];

          try {
            const jsonStr = result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult);
            if (jsonStr) {
              const json = JSON.parse(jsonStr);
              const nBestWords = json.NBest?.[0]?.Words || [];
              for (const w of nBestWords) {
                words.push({
                  word: w.Word,
                  accuracyScore: Math.round(w.PronunciationAssessment?.AccuracyScore ?? 0),
                  errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                });
              }
            }
          } catch {
            // fallback
          }

          resolve({
            score: pronunciationResult.pronunciationScore,
            accuracyScore: pronunciationResult.accuracyScore,
            fluencyScore: pronunciationResult.fluencyScore,
            completenessScore: pronunciationResult.completenessScore,
            transcript: result.text,
            words,
          });
        } else {
          reject(new Error('Không thể nhận diện giọng đọc bài. Lỗi: ' + (result.errorDetails || 'Âm thanh không rõ')));
        }
      },
      (err) => {
        recognizer.close();
        reject(err);
      }
    );
  } catch (err) {
    reject(err);
  }

  return promise;
}
