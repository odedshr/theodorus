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
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:exslt="http://exslt.org/common" xmlns:xslt="http://www.w3.org/1999/XSL/Transform">
    <xsl:import href="account.xsl" />
    <xsl:import href="feed.xsl" />
    <xsl:import href="topic.xsl" />
    <!--<xsl:import href="moderator.xsl" />
    <xsl:import href="tools.xsl" />-->
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>

    <xsl:template match="app"  name="app">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <title><xsl:value-of select="$window_title" /></title>

                <meta charset='utf-8' />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

                <xsl:if test="app/page/topic"> - <xsl:value-of select="app/page/topic/title" /></xsl:if>

                <link type="text/css" rel='stylesheet' href="/ui/css/base.css" />
                <style>
                    html { direction: rtl; }
                </style>
                <xsl:if test="@version != 'false'">
                    <script>
                        theodorusUIVersion = "<xsl:value-of select="@version"/>";
                    </script>
                </xsl:if>
                <script language="javascript" type="text/javascript" src="/lib/jquery.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/jquery.transform.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/date.format.js"></script>
                <script language="javascript" type="text/javascript" src="/node_modules/underscore/underscore.js"></script>
                <!--
                <script language="javascript" type="text/javascript" src="/lib/inheritance.js"></script>
                <script language="javascript" type="text/javascript" src="/node_modules/backbone/backbone.js"></script>-->
                <script language="javascript" type="text/javascript" src="/lib/modernizr.custom.98249.js"></script>
                <script language="javascript" type="text/javascript" src="/js/theodorus.js"></script>
                <script language="javascript" type="text/javascript" src="/js/utilities.js"></script>
                <xsl:choose>
                    <xsl:when test="//app/mode = 'dev'">
                        <script language="javascript" type="text/javascript" src="/lib/json.js"></script>
                    </xsl:when>
                </xsl:choose>
                <!--
                <xsl:choose>
                    <xsl:when test="//app/mode = 'dev'">
                        <script language="javascript" type="text/javascript" src="/js/controllers/AbstractController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/TopicListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/AddTopicController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/FeedController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/AccountController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/SigninController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/SignupController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/TagCloudController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/TopicController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/feed/SearchController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/moderator/IssueController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/moderator/IssueListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/moderator/ModeratorController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/BugReportController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/tools/MessageController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/comment/AddCommentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/comment/CommentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/comment/CommentListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/AlternativeSectionController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/SectionController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/TopicContentController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/topic/TopicTagsController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/notification/NotificationController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/notification/NotificationCountController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/notification/NotificationListController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/settings/ChangePasswordController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/settings/ChangeProfilePictureController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/settings/SettingsController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/UserController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/controllers/user/ResetPasswordController.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/AbstractView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/TopicListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/AddTopicView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/FeedView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/SigninView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/SignupView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/AccountView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/TagCloudView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/TopicView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/feed/SearchCloudView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/moderator/IssueView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/moderator/IssueListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/moderator/ModeratorView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/tools/BugReportView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/comment/AddCommentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/comment/CommentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/comment/CommentListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/AlternativeParagraphView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/ParagraphView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/TopicContentView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/topic/TopicTagsView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/notification/NotificationView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/notification/NotificationCountView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/notification/NotificationListView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/settings/ChangePasswordView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/settings/ChangeProfilePictureView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/settings/SettingsView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/UserView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/views/user/ResetPasswordView.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/models/AbstractModel.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/models/Notification.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/models/Topic.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/models/Credentials.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/models/User.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/models/Tag.js"></script>
                    </xsl:when>
                    <xsl:otherwise>
                        <script language="javascript" type="text/javascript" src="/js/theodorus.models.min.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/theodorus.controllers.min.js"></script>
                        <script language="javascript" type="text/javascript" src="/js/theodorus.views.min.js"></script>
                    </xsl:otherwise>
                </xsl:choose>
                -->
            </head>

            <body>
                <span class="force-web-font-preload">Loading fonts...</span>
                <header class="page-header">
                   <a href="/"><h1><span><xsl:value-of select="$app_name" /></span><sub>Beta</sub></h1></a>
                   <div class="intro_text"><xsl:value-of select="$text_intro" /></div>
                </header>
                <div id="main" class="page-content">
                    <xsl:apply-templates select="page"/>
                </div>
                <div id="sidebar" class="page-sidebar">
                    <div id="account" class="account_menu">
                        <xsl:apply-templates select="//user" />
                    </div>
                    <nav class="nav_buttons">
                        <ul class="nav_buttons-list">
                            <li class="nav_button nav_blog"><a href="http://theodev.wordpress.com" accesskey="b" target="_blank"><xsl:value-of select="$nav_blog" /></a></li>
                            <li class="nav_button nav_features"><a href="https://trello.com/b/gtJnohoz/features" accesskey="t" target="_blank"><xsl:value-of select="$nav_features" /></a></li>
                            <li class="nav_button nav_sourcecode"><a href="https://github.com/odedshr/theodorus" accesskey="g" target="_blank"><xsl:value-of select="$nav_sourcecode" /></a></li>
                            <!-- li><a href="donations" accesskey="t"><xsl:value-of select="$nav_donations" /></a></li -->
                        </ul>
                    </nav>
                    <xsl:if test="page/tags">
                        <div class="tags">
                            <a name="tags" class="tags-title"><xsl:value-of select="$lbl_tags"/></a>
                            <ul class="tag-list">
                                <xsl:for-each select="page/tags/tag">
                                    <li class="tag">
                                        <a href="/tags/{tag}" class="tag-label"><xsl:value-of select="tag" /></a>
                                        <span class="tag-count"><xsl:value-of select="count" /></span>
                                    </li>
                                </xsl:for-each>
                            </ul>
                        </div>
                    </xsl:if>
                </div>
                <div id="popup_placeholder" />
                <ul id="messages" class="messages">
                    <xsl:for-each select="message">
                        <li><xsl:apply-templates select="."/></li>
                    </xsl:for-each>
                </ul>
                <div id="report-bugs" />
            </body>
        </html>
    </xsl:template>

    <xsl:template match="count">
        <span class="count"><xsl:value-of select="." /></span>
    </xsl:template>

    <xsl:template match="page[@type='message']">
        <div class="error-message">
            <h2><xsl:value-of select="$error_has_occoured" />: <xsl:apply-templates select="message" /></h2>
            <xsl:choose>
                <xsl:when test="referer"><a href="{referer}"><xsl:value-of select="$previous_page" /></a></xsl:when>
                <xsl:otherwise><a href="/"><xsl:value-of select="$link_to_main_page" /></a></xsl:otherwise>
            </xsl:choose>
        </div>
    </xsl:template>

    <xsl:template match="message[@type='error']">
        <xsl:variable name="vSelector" select="@message"/>
        <xsl:variable name="errorMessage" select="exslt:node-set($errorMessages)/*[@type=$vSelector]"/>
        <xsl:choose>
            <xsl:when test="count(exslt:node-set($errorMessages)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$errorMessage"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$error_unknown" /> (<xsl:value-of select="@message" />)
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="message[@type='info']">
        <xsl:variable name="vSelector" select="@message"/>
        <xsl:variable name="infoMessage" select="exslt:node-set($infoMessages)/*[@type=$vSelector]"/>
        <xsl:choose>
            <xsl:when test="count(exslt:node-set($infoMessages)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$infoMessage"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$error_unknown" /> (<xsl:value-of select="@message" />)
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="fileNotFound">
        <div id="item_not_found">
            <h1><xsl:value-of select="$file_not_found_title" /></h1>
            <div id="instructions">
                <xsl:copy-of  select="$file_not_found-what_to_do" />
            </div>
        </div>
    </xsl:template>

    <xsl:template match="popup">
        <div class="window_background">
            <div class="window_content">
                <xsl:apply-templates />
            </div>
        </div>
    </xsl:template>

    <xsl:template match="mail-subject"><xsl:variable name="vSelector" select="@label"/><xsl:value-of select="exslt:node-set($mailSubjects)/*[@key=$vSelector]"/></xsl:template>
    <xsl:template match="mail-body"><xsl:variable name="vSelector" select="@label"/><xsl:value-of select="exslt:node-set($mailBody)/*[@key=$vSelector]"/></xsl:template>

    <xsl:template match="testUnits">
       <h1>Theodorus Unit Tests</h1>
        <table id="unitTests">
            <thead>
                <tr>
                    <th class="process">Process</th>
                    <th class="process">Test</th>
                    <th class="method">Method</th>
                    <th class="url">URL</th>
                    <th class="input">Input</th>
                    <th class="expectedOutput">Expected Output</th>
                    <th class="output">Output</th>
                </tr>
            </thead>
            <tbody>
                <xsl:apply-templates select="test"/>
            </tbody>
        </table>
    </xsl:template>

    <xsl:template match="test">
        <tr class="result-{result}">
            <td><xsl:value-of select="process" /></td>
            <td><xsl:value-of select="name" /></td>
            <td><xsl:value-of select="method" /></td>
            <td><xsl:value-of select="url" /></td>
            <td><xsl:value-of select="input" /></td>
            <td><pre><xsl:value-of select="expectedOutput" /></pre></td>
            <td><pre><xsl:value-of select="output" /></pre></td>
        </tr>
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

    <xsl:template match="datetime">
        <xsl:call-template name="datetime-render">
            <xsl:with-param name="value" select="." />
        </xsl:call-template>
    </xsl:template>

    <xsl:template name="datetime-render">
        <xsl:param name="value" />
        <xsl:choose>
            <xsl:when test="$value/pattern">
                <xsl:variable name="vSelector" select="$value/pattern"/>
                <!--<xsl:variable name="prettyCreated" select="exslt:node-set($timestamps)/*[@id=$vSelector]"/> -->
                <xsl:variable name="prettyCreated">
                    <xsl:call-template name="string-replace-all">
                        <xsl:with-param name="text" select="exslt:node-set($timestamps)/*[@id=$vSelector]" />
                        <xsl:with-param name="replace" select="'#'" />
                        <xsl:with-param name="by" select="$value/patternValue" />
                    </xsl:call-template>
                </xsl:variable>
                <time class="created" datetime="{$value/timestamp}" title="{$value/formatted}"><xsl:value-of select="$prettyCreated" /></time>
            </xsl:when>
            <xsl:otherwise>
                <time class="created" datetime="{$value/timestamp}" title="{$value/formatted}"><xsl:value-of select="$value/formatted" /></time>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>