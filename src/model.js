'use strict';

import mongoose from 'mongoose';
import {mongo as mongoConfig} from './config';

const Schema = mongoose.Schema;

mongoose.connect(mongoConfig.databaseURL, {useNewUrlParser: true});

const UserData = mongoose.model('UserData', new Schema({
        userId: {
            type: String,
            index: {unique: true}
        }
    }, {
        strict: false
    })
);
const ConversationData = mongoose.model('ConversationData',
    new Schema({
        convId: {
            type: String,
            index: {unique: true}
        }
    }, {
        strict: false
    }));

module.exports = {
    UserData,
    ConversationData
};