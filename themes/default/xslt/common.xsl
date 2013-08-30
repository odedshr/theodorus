<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xsl:stylesheet  [
        <!ENTITY nbsp   "&#160;">
        <!ENTITY copy   "&#169;">
        <!ENTITY reg    "&#174;">
        <!ENTITY trade  "&#8482;">
        <!ENTITY mdash  "&#8212;">
        <!ENTITY ldquo  "&#8220;">
        <!ENTITY rdquo  "&#8221;">
        <!ENTITY pound  "&#163;">
        <!ENTITY yen    "&#165;">
        <!ENTITY euro   "&#8364;">
        ]>
<xsl:stylesheet id="sheet" version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:import href="account.xsl" />
    <xsl:import href="feed.xsl" />
    <xsl:import href="moderator.xsl" />
    <xsl:import href="tools.xsl" />
    <xsl:import href="topic.xsl" />
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>

    <xsl:template match="app"  name="app">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta charset='utf-8' />
                <title><xsl:value-of select="$window_title" /></title>

                <link type="text/css" rel='stylesheet' href="/ui/css/base.css" />

                <script language="javascript" type="text/javascript" src="/lib/jquery.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/jquery.transform.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/json.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/inheritance.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/pretty.js"></script>
                <script language="javascript" type="text/javascript" src="/node_modules/underscore/underscore.js"></script>
                <script language="javascript" type="text/javascript" src="/node_modules/backbone/backbone.js"></script>
                <script language="javascript" type="text/javascript" src="/js/theodorus.js"></script>
                <script language="javascript" type="text/javascript" src="/js/utilities.js"></script>
                <xsl:choose>
                    <xsl:when test="@mode = 'dev'">
                        <!-- controllers-->
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/TopicListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/TopicSummaryController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/TopicUserController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/AddTopicController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/FeedController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/SearchController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/TagCloudController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/TagCountController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/moderator/IssueController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/moderator/IssueListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/moderator/ModeratorController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/action/ActionController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/action/CommentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/action/FollowController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/action/LikeController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/action/ReportController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/BugReportController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/MessageController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/comment/AddCommentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/comment/CommentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/comment/CommentListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/AlternativeSectionController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/SectionController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/TopicContentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/TopicController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/TopicTagsController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/notification/NotificationController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/notification/NotificationCountController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/notification/NotificationListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/settings/ChangePasswordController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/settings/ChangeProfilePictureController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/settings/SettingsController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/AccountController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/UserController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/ResetPasswordController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/SigninController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/SignupController.js"></script>
                        <!-- views -->
                        <script language="javascript" type="text/javascript" src="/ui/js/views/AbstractView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/TagCountView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/TopicListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/TopicSummaryView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/TopicUserView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/AddTopicView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/FeedView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/SearchCloudView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/feed/TagCloudView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/moderator/IssueView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/moderator/IssueListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/moderator/ModeratorView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/action/ActionView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/action/CommentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/action/FollowView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/action/LikeView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/action/ReportView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/BugReportView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/tools/MessageView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/comment/AddCommentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/comment/CommentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/comment/CommentListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/AlternativeParagraphView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/ParagraphView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/TopicContentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/TopicView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/topic/TopicTagsView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/notification/NotificationView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/notification/NotificationCountView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/notification/NotificationListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/settings/ChangePasswordView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/settings/ChangeProfilePictureView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/settings/SettingsView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/AccountView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/UserView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/ResetPasswordView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/SigninView.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views/user/SignupView.js"></script>
                        <!-- models-->
                        <script language="javascript" type="text/javascript" src="/core/models/AbstractModel.js"></script>
                        <script language="javascript" type="text/javascript" src="/core/models/Topic.js"></script>
                        <script language="javascript" type="text/javascript" src="/core/models/Credentials.js"></script>
                        <script language="javascript" type="text/javascript" src="/core/models/User.js"></script>
                    </xsl:when>
                    <xsl:otherwise>
                        <script language="javascript" type="text/javascript" src="/js/models.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers.js"></script>
                        <script language="javascript" type="text/javascript" src="/ui/js/views.js"></script>
                    </xsl:otherwise>
                </xsl:choose>
            </head>

            <body>
                <div id="messages" />
                <div id="report-bugs" />
                <div id="main">
                    <xsl:apply-templates />
                </div>
                <div id="popup_placeholder" />
            </body>
        </html>
    </xsl:template>

    <xsl:template match="message[@type='error']">
        <xsl:variable name="vSelector" select="@message"/>
        <xsl:variable name="errorMessage" select="ext:node-set($errorMessages)/*[@type=$vSelector]"/>
        <xsl:choose>
            <xsl:when test="count(ext:node-set($errorMessages)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$errorMessage"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$err_unknown_error" /> (<xsl:value-of select="@message" />)
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="message[@type='info']">
        <xsl:variable name="vSelector" select="@message"/>
        <xsl:variable name="infoMessage" select="ext:node-set($infoMessages)/*[@type=$vSelector]"/>
        <xsl:choose>
            <xsl:when test="count(ext:node-set($infoMessages)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$infoMessage"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$err_unknown_error" /> (<xsl:value-of select="@message" />)
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="fileNotFound">
        <div id="item_not_found">
            <h1>Not found <span>:(</span></h1>
            <p>Sorry, but the page you were trying to view does not exist.</p>
            <p>It looks like this was the result of either:</p>
            <ul>
                <li>a mistyped address</li>
                <li>an out-of-date link</li>
            </ul>
        </div>
    </xsl:template>

    <xsl:template match="popup">
        <div class="window_background">
            <div class="window_content">
                <xsl:apply-templates />
            </div>
        </div>
    </xsl:template>

    <xsl:template name="string-replace-all">
        <xsl:param name="text" />
        <xsl:param name="replace" />
        <xsl:param name="by" />
        <xsl:choose>
            <xsl:when test="contains($text, $replace)">
                <xsl:value-of select="substring-before($text,$replace)" />
                <xsl:value-of select="$by" />
                <xsl:call-template name="string-replace-all">
                    <xsl:with-param name="text"
                                    select="substring-after($text,$replace)" />
                    <xsl:with-param name="replace" select="$replace" />
                    <xsl:with-param name="by" select="$by" />
                </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$text" />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>