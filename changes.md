made changes on sortable.js

commented out angular-elastic --> line 105

https://github.com/spk0611/cordova-plugin-local-notifications ##fixes ios10 local notification not firing / include still untested android fix

            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <action android:name="android.intent.action.SEND_MULTIPLE" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/*" />
            </intent-filter>