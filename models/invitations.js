'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invitations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Invitations.belongsTo(models.User, { as: 'Sender', foreignKey: 'sender_id' });
      Invitations.belongsTo(models.User, { as: 'Receiver', foreignKey: 'receiver_id' });
      Invitations.belongsTo(models.Group, { foreignKey: 'group_id' });
    }
  }
  Invitations.init({
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
    status: {
      type: DataTypes.ENUM('accepted', 'declined', 'pending'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Invitations',
    tableName: 'invitations',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return Invitations;
};