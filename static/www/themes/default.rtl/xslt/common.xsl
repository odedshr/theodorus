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
    <xsl:include href="account.xsl" />
    <xsl:include href="feed.xsl" />
    <xsl:include href="topic.xsl" />
    <xsl:include href="../../../plugins/include.xsl" />
    <!--<xsl:import href="moderator.xsl" />
    <xsl:import href="tools.xsl" />-->
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:template match="app" name="app">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <title><xsl:value-of select="$window_title" /></title>

                <meta charset='utf-8' />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

                <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
                <link rel="icon" href="/favicon.ico" type="image/x-icon" />

                <xsl:if test="app/page/topic"> - <xsl:value-of select="app/page/topic/title" /></xsl:if>

                <link type="text/css" rel='stylesheet' href="/ui/core.css" />
                <style>
                    html { direction: rtl; }
                </style>
                <xsl:if test="@version != 'false'">
                    <script>
                        theodorusUIVersion = "<xsl:value-of select="@version"/>";
                    </script>
                </xsl:if>
                <script language="javascript" type="text/javascript" src="/lib/jquery.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/date.format.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/underscore-min.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/modernizr.custom.98249.js"></script>
                <script language="javascript" type="text/javascript" src="/js/theodorus.min.js"></script>
                <script language="javascript" type="text/javascript" src="/js/theodorus.utils.min.js"></script>
                <xsl:choose>
                    <xsl:when test="//app/mode = 'dev'">
                        <script language="javascript" type="text/javascript" src="/lib/json.js"></script>
                    </xsl:when>
                </xsl:choose>
            </head>

            <body>
                <span class="force-web-font-preload">Loading fonts...</span>
                <header class="page-header">
                   <a href="/"><h1><span><xsl:value-of select="$app_name" /></span><sub>Beta</sub></h1></a>
                   <div class="intro_text">
                       <span><xsl:value-of select="$text_intro" /></span>
                       <xsl:if test="//userCount">
                           <xsl:variable name="communitySizeString">
                               <xsl:call-template name="string-replace-all">
                                   <xsl:with-param name="text" select="$community_has_X_members" />
                                   <xsl:with-param name="replace" select="'#'" />
                                   <xsl:with-param name="by" select="//userCount" />
                               </xsl:call-template>
                           </xsl:variable>
                           <span class="community-size"><xsl:value-of select="$communitySizeString"/></span>
                       </xsl:if>
                   </div>
                </header>
                <div id="main" class="page-content">
                    <xsl:apply-templates select="page" />
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
                </div>
                <div id="popup_placeholder" />
                <ul id="messages" class="messages">
                    <xsl:for-each select="message">
                        <li><xsl:apply-templates select="."/></li>
                    </xsl:for-each>
                </ul>
                <div id="report-bugs" />
                <div id="plugins" class="plugins">
                    <xsl:apply-templates select="plugins" />
                </div>
            </body>
        </html>
    </xsl:template>

    <!-- page without type. how did this happen? (maybe because of plugin)-->
    <xsl:template match="page[not(@type)]"></xsl:template>

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
    <xsl:template match="mail[@type='logged-action']">
        <div class="theodorus-mail" style="direction:rtl;text-align:right;">
            <h1><img src="{data/server}/ui/img/theodorus_logo_small.png" alt="$app_name"/></h1>
            <div><label><xsl:value-of select="$logged_action_server" /></label><div><xsl:value-of select="data/server" /></div></div>
            <div><label><xsl:value-of select="$logged_action_type" /></label><div><xsl:value-of select="data/type" /></div></div>
            <div><label><xsl:value-of select="$logged_action_content" /></label><div><xsl:value-of select="data/content" /></div></div>
        </div>
    </xsl:template>


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