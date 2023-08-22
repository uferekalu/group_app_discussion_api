'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notifications extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Notifications.belongsTo(models.User, { as: 'Sender', foreignKey: 'sender_id' });
      Notifications.belongsTo(models.User, { as: 'Receiver', foreignKey: 'receiver_id' });
      Notifications.belongsTo(models.Group, { foreignKey: 'group_id' });
      Notifications.belongsTo(models.Discussions, { foreignKey: 'discussion_id' });
    }
  }
  Notifications.init({
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discussion_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Notifications',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return Notifications;
};