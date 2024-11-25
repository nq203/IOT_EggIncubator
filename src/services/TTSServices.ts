import Tts from 'react-native-tts';

class TTSService {
  constructor() {
    // Khởi tạo ngôn ngữ mặc định
    this.initializeTTS();
  }

  async initializeTTS() {
    try {
      // Thiết lập ngôn ngữ là tiếng Việt
      await Tts.setDefaultLanguage('vi-VN');
      console.log('Ngôn ngữ được thiết lập thành tiếng Việt');

      // Thiết lập giọng nói tiếng Việt nếu có
      const voices = await Tts.voices();
      const vietnameseVoice = voices.find(voice => voice.language === 'vi-VN');
      if (vietnameseVoice) {
        await Tts.setDefaultVoice(vietnameseVoice.id);
        console.log('Giọng nói tiếng Việt được thiết lập:', vietnameseVoice.name);
      }
    } catch (error) {
      console.error('Không thể khởi tạo TTS:', error);
    }
  }

  // Hàm đọc văn bản
  speak(text: string) {
    try {
      Tts.speak(text);
      console.log(`Đang đọc: "${text}"`);
    } catch (error) {
      console.error('Không thể đọc văn bản:', error);
    }
  }

  // Hàm dừng đọc
  stop() {
    try {
      Tts.stop();
      console.log('Đã dừng đọc');
    } catch (error) {
      console.error('Không thể dừng TTS:', error);
    }
  }

  // Hàm tạm dừng
  pause() {
    try {
      Tts.pause();
      console.log('Đã tạm dừng TTS');
    } catch (error) {
      console.error('Không thể tạm dừng TTS:', error);
    }
  }

  // Hàm tiếp tục đọc
  resume() {
    try {
      Tts.resume();
      console.log('Đã tiếp tục TTS');
    } catch (error) {
      console.error('Không thể tiếp tục TTS:', error);
    }
  }
}

const ttsService = new TTSService();
export default ttsService;
