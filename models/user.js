'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcrypt');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Group_members, { foreignKey: 'user_id' });
      User.hasMany(models.Discussions, { foreignKey: 'author_id' });
      User.hasMany(models.Comments, { foreignKey: 'author_id' });
      User.hasMany(models.Replies, { foreignKey: 'author_id' });
      User.hasMany(models.Invitations, { as: 'SentInvitations', foreignKey: 'sender_id' });
      User.hasMany(models.Invitations, { as: 'ReceivedInvitations', foreignKey: 'receiver_id' });
      User.hasMany(models.Notifications, { as: 'SentNotifications', foreignKey: 'sender_id' });
      User.hasMany(models.Notifications, { as: 'ReceivedNotifications', foreignKey: 'receiver_id' });
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(value, salt);
        this.setDataValue('password', hashedPassword);
      }
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hobbies: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return User;
};