'use client'
import React, { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../../Database/firebaseConfig';
import { Grid } from '@mui/material';

const Camera = () => {
  const [mode, setMode] = useState('manual');
  const [latestPhoto, setLatestPhoto] = useState('');
  const [autoPhotos, setAutoPhotos] = useState([]);
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [currentInterval, setCurrentInterval] = useState(null);

  useEffect(() => {
    // Lắng nghe trạng thái hiện tại từ Firebase
    const captureRef = ref(database, 'capture');
    onValue(captureRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setMode(data.mode);
        if (data.mode === 'auto') {
          const intervalInSeconds = data.interval;
          setCurrentInterval(intervalInSeconds);
          // Chuyển đổi ngược lại để hiển thị trong input
          if (intervalInSeconds >= 3600) {
            setTimeValue((intervalInSeconds / 3600).toString());
            setTimeUnit('hours');
          } else if (intervalInSeconds > 0) {
            setTimeValue((intervalInSeconds / 60).toString());
            setTimeUnit('minutes');
          }
        }
      }
    });

    // Lắng nghe thay đổi ảnh
    const photosRef = ref(database, 'photos');
    onValue(photosRef, (snapshot) => {
      if (snapshot.exists()) {
        const photos = snapshot.val();
        const photoUrls = Object.values(photos);
        setLatestPhoto(photoUrls[photoUrls.length - 1]);
        
        if (mode === 'auto') {
          setAutoPhotos(photoUrls);
        }
      }
    });
  }, [mode]);

  const handleCapture = () => {
    const captureRef = ref(database, 'capture');
    set(captureRef, {
      command: true,
      mode: 'manual',
      interval: 0
    });
    
    setTimeout(() => {
      set(captureRef, {
        command: false,
        mode: 'manual',
        interval: 0
      });
    }, 1000);
  };

  const handleAutoMode = () => {
    const seconds = calculateSeconds();
    const captureRef = ref(database, 'capture');
    set(captureRef, {
      command: false,
      mode: 'auto',
      interval: seconds
    });
    setCurrentInterval(seconds);
  };

  const calculateSeconds = () => {
    const value = parseInt(timeValue);
    if (timeUnit === 'minutes') {
      return value * 60;
    } else {
      return value * 60 * 60;
    }
  };

  const handleModeChange = (newMode) => {
    const captureRef = ref(database, 'capture');
    if (newMode === 'manual') {
      set(captureRef, {
        command: true,
        mode: 'manual',
        interval: 0
      });
      
      setTimeout(() => {
        set(captureRef, {
          command: false,
          mode: 'manual',
          interval: 0
        });
      }, 1000);
    } else {
      // Khi chuyển sang auto mode, giữ nguyên interval hiện tại
      set(captureRef, {
        command: false,
        mode: 'auto',
        interval: currentInterval || 0
      });
      setAutoPhotos([]);
    }
    setMode(newMode);
  };

  return (
    <div className="camera-container">
      <div className="card">
        <h2 className="title">Camera Control Panel</h2>
        
        <div className="mode-buttons">
          <button 
            className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => handleModeChange('manual')}>
            <i className="fas fa-camera"></i>
            Manual Mode
          </button>
          <button 
            className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => handleModeChange('auto')}>
            <i className="fas fa-clock"></i>
            Auto Mode
          </button>
        </div>
  
        {mode === 'manual' ? (
          <div className="manual-container">
            <button className="capture-button" onClick={handleCapture}>
              <i className="fas fa-camera"></i>
              Chụp ảnh
            </button>
            {latestPhoto && (
              <div className="image-container">
                <img src={latestPhoto} alt="Preview" className="preview" />
              </div>
            )}
          </div>
        ) : (
          <div className="auto-container">
            <div className="input-group">
              <input
                type="number"
                className="time-input"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                placeholder="Nhập thời gian"
              />
              <div className="unit-buttons">
                <button 
                  className={`unit-btn ${timeUnit === 'minutes' ? 'active' : ''}`}
                  onClick={() => setTimeUnit('minutes')}>
                  Phút
                </button>
                <button 
                  className={`unit-btn ${timeUnit === 'hours' ? 'active' : ''}`}
                  onClick={() => setTimeUnit('hours')}>
                  Giờ
                </button>
              </div>
            </div>
            <button className="set-button" onClick={handleAutoMode}>
              <i className="fas fa-check"></i>
              Cài đặt
            </button>

            {/* Hiển thị thời gian đã set */}
            {currentInterval > 0 && (
              <div className="interval-display">
                <p>Đang chụp mỗi: {' '}
                  {currentInterval >= 3600 ? (
                    `${(currentInterval / 3600).toFixed(1)} giờ`
                  ) : currentInterval >= 60 ? (
                    `${(currentInterval / 60).toFixed(1)} phút`
                  ) : (
                    `${currentInterval} giây`
                  )}
                </p>
              </div>
            )}

            {/* Hiển thị lưới ảnh trong chế độ auto */}
            {autoPhotos.length > 0 && (
              <div className="auto-photos-grid">
                <Grid container spacing={2}>
                  {autoPhotos.map((photo, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <div className="auto-image-container">
                        <img src={photo} alt={`Auto ${index + 1}`} className="auto-preview" />
                      </div>
                    </Grid>
                  ))}
                </Grid>
              </div>
            )}
          </div>
        )}
        </div>
    </div>
    );
}

export default Camera;
