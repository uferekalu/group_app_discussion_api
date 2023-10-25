'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Comments.belongsTo(models.User, { foreignKey: 'author_id' });
      Comments.belongsTo(models.Discussions, { foreignKey: 'discussion_id' });
      Comments.hasMany(models.Replies, { foreignKey: 'comment_id' });
    }
  }
  Comments.init({
    content: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discussion_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dislikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Comments',
    tableName: 'comments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return Comments;
};