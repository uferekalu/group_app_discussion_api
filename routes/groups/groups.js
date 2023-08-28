const { Router } = require('express');
const groupControllers = require('../../controllers/groups/groups');
const router = Router();
const { isUser } = require('../../middleware/auth')

router.post('/create-group', isUser, groupControllers.createGroup)
router.get('/all-groups', isUser, groupControllers.getAllGroups)
router.get('/single-group/:groupId', isUser, groupControllers.getAGroup)
router.post('/send-invitation/:groupId', isUser, groupControllers.sendInviteToJoinAGroup)
router.post('/join-a-group/:groupId', isUser, groupControllers.joinAgroup)
router.patch('/update-group/:groupId', isUser, groupControllers.updateAGroup)
router.post('/handle-invite-notification', isUser, groupControllers.handleInvitationNotification)
router.post('/create-a-discussion', isUser, groupControllers.createDiscussion)
router.get('/discussions/:groupId', isUser, groupControllers.getAllDiscussionsInAGroup)
router.get('/discussions/:groupId/:discussionId/comments', isUser, groupControllers.getAllCommentsFromADiscussion)
router.get('/discussions/:groupId/:discussionId/comments/:commentId', isUser, groupControllers.getACommentByUserInADiscussion)
router.post('/comment', isUser, groupControllers.makeAComment)
router.get('/discussion/:discussionId/total-likes-dislikes', isUser, groupControllers.getTotalLikesAndDisLikesForADiscussion)
router.get('/user-notifications-in-group/:groupId', isUser, groupControllers.userNotificationsInGroup)
router.get('/all-invite-notifications', isUser, groupControllers.getInviteNotifications)
router.get('/handle-discussion-notification/:groupId/:discussionId', isUser, groupControllers.handleDiscussionNotifications)
router.post('/reply/:commentId', isUser, groupControllers.replyComment)
router.delete('/:groupId', isUser, groupControllers.deleteAGroup)

module.exports = router