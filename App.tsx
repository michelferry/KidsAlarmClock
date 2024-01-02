import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import KeepAwake from 'react-native-keep-awake';
import moment from 'moment';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';

const App = () => {
  const [currentTime, setCurrentTime] = useState(moment());
  const [alarmTime, setAlarmTime] = useState(moment());
  const [alarmTimeLoaded, setAlarmTimeLoaded] = useState(false);
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [alarmMusic, setAlarmMusic] = useState(null);
  let Sound = require('react-native-sound');

  const loadAlarmTime = async () => {
    try {
      const storedAlarmTime = await retrieveAlarmTime();
      if (storedAlarmTime !== null) {
        setAlarmTime(moment(storedAlarmTime));
        setAlarmTimeLoaded(true);
      }
    } catch (error) {
      console.log('Error retrieving the alarm time:', error);
    }
  };


  useEffect(() => {
    // Retrieve alarm time
    loadAlarmTime();
    Sound.setCategory('Playback');
    // Load the sound
    const mySound = new Sound('lion_song.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        return;
      } else {
        // loaded successfully
        mySound.setVolume(1);
        setAlarmMusic(mySound)
        console.log('duration in seconds: ' + mySound.getDuration() + 'number of channels: ' + mySound.getNumberOfChannels());
      }
    });
  }, []);

  useEffect(() => {
     // Check if it's time to set off the alarm
     const interval = setInterval(() => {
      const now = moment();
      setCurrentTime(now);
      if (now.hours() === alarmTime.hours() && now.minutes() === alarmTime.minutes() && alarmTimeLoaded) {
        setIsAlarmSet(true);
      }
    }, 1000); // Check every second

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [alarmTime, musicOn, alarmTimeLoaded]);

  useEffect(() => {
    setIsAlarmSet(false);
  }, [alarmTime]);

  useEffect(() => {
    // Cleanup function
    return () => {
      if(alarmMusic != null){
        alarmMusic.release(); // Release the sound resource on component unmount
      }
    };
  }, [alarmMusic]);

  useEffect(() => {
    if (isAlarmSet && musicOn && !isSoundPlaying && !!alarmMusic) {
      playSound();
    }
  }, [isAlarmSet, ]);

  // Function to play sound
  const playSound = () => {
    setIsSoundPlaying(true);
    alarmMusic.play((success) => {
      if(success){
        console.log('Sound played successfully');
        setIsSoundPlaying(false);
        alarmMusic.setCurrentTime(0);
      } else {
        console.log('Sound playback failed due to audio decoding errors');
      }
    });
  };

  const handleOnAlarmPress = () => {
    setDatePickerVisibility(true);
  }

  const handleDatePickerConfirm = (time) => {
    setAlarmTime(moment(time));
    storeAlarmTime(time);
    setDatePickerVisibility(false);
  }

  const handleDatePickerCancel = () => {
    setDatePickerVisibility(false);
  }

  const handleOnMusicSettingsPress = () => {
    if(musicOn){
      setMusicOn(false)
    } else {
      setMusicOn(true)
    }
  }

  const storeAlarmTime = async (date) => {
    try {
      await AsyncStorage.setItem('ALARM_TIME', date.toISOString());
    } catch (error) {
      console.log(error);
    }
  };

  const retrieveAlarmTime = async () => {
    try {
      const value = await AsyncStorage.getItem('ALARM_TIME');
      if (value !== null) {
        return new Date(value);
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  

  return (
    <SafeAreaView style={styles.container}>
      <KeepAwake />
      {isAlarmSet && 
        <Image
          source={require('./assets/img/lion-day.png')}
          style={styles.backgroundImage}
        />
      }
      {!isAlarmSet && 
        <Image
          source={require('./assets/img/lion-night.png')}
          style={styles.backgroundImage}
        />
      }
      <View style={styles.centeredView}>
        <Text style={styles.timeText}>{currentTime.format("HH:mm")}</Text>
      </View>
      <View style={styles.alarmTime}>
        <TouchableOpacity onPress={handleOnAlarmPress} style={styles.alarmPressableArea}>
          <Icon name="bell" size={30} color="white" />
          <Text style={styles.alarmText}>{alarmTime.format("HH:mm")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.musicSettings}>
        {!musicOn && 
          <TouchableOpacity onPress={handleOnMusicSettingsPress} style={styles.alarmPressableArea}>
            <Icon name="volume-mute" size={30} color="white" />
          </TouchableOpacity>
        }
        {musicOn && 
          <TouchableOpacity onPress={handleOnMusicSettingsPress} style={styles.alarmPressableArea}>
            <Icon name="volume-up" size={30} color="white" />
          </TouchableOpacity>
        }
      </View> 
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="time"
        date={alarmTime.toDate()}
        onConfirm={handleDatePickerConfirm}
        onCancel={handleDatePickerCancel}
      />
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position:'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  timeText: {
    fontSize: 200,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Montserrat'
  },
  alarmText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
    marginLeft: 20
  },
  alarmTime: {
    position:'absolute',
    left: 20,
    bottom: 10,
  },
  alarmPressableArea : {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicSettings: {
    position:'absolute',
    right: 20,
    bottom: 10,
  }
});

export default App;