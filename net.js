'use strict';

const _ = require('lodash');
const assert = require('assert');
const ProtoBuf = require('protobufjs');
const util = require('util');
const path = require('path');

ProtoBuf.convertFieldsToCamelCase = true;
const builder = ProtoBuf.loadProtoFile(path.resolve(__dirname, 'protobufs/cstrike15_usermessages.proto')).build();
assert(builder !== null);

function enumNetNameToClassName(enumName) {
  const type = enumName.slice(0, 3);
  assert(['net', 'svc'].indexOf(type) !== -1, 'unexpected message type');

  return util.format('C%sMsg_%s', type.toUpperCase(), enumName.slice(4));
}

function enumUMNameToClassName(enumName) {
  return util.format('CCSUsrMsg_%s', enumName.slice(6));
}

function processMessageEnum(messages, enumNameConverterFunc) {
  return _.chain(_.invert(messages))
    .mapValues((name, type) => {
      const cls = builder[enumNameConverterFunc(name)];

      if (cls === undefined) {
        return null;
      }

      return {
        type,
        name,
        'class': cls
      };
    })
    .value();
}

const combinedMessages = processMessageEnum(_.merge(builder['NET_Messages'], builder['SVC_Messages']), enumNetNameToClassName);

const userMessages = processMessageEnum(builder['ECstrike15UserMessages'], enumUMNameToClassName);

module.exports = {
  builder: builder,

  messages: combinedMessages,
  findByName(name) { return _.find(combinedMessages, _.matchesProperty('name', name)); },
  findByType(type) { return combinedMessages[type]; },

  userMessages: userMessages,
  findUserMessageByName(name) { return _.find(userMessages, _.matchesProperty('name', name)); },
  findUserMessageByType(type) { return userMessages[type]; }
};
