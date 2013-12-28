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
                xmlns:exslt="http://exslt.org/common">
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
                <style>
                    html { direction: rtl; }
                </style>

                <script language="javascript" type="text/javascript" src="/lib/jquery.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/jquery.transform.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/json.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/inheritance.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/pretty.js"></script>
                <script language="javascript" type="text/javascript" src="/lib/date.format.js"></script>
                <script language="javascript" type="text/javascript" src="/node_modules/underscore/underscore.js"></script>
                <script language="javascript" type="text/javascript" src="/node_modules/backbone/backbone.js"></script>
                <script language="javascript" type="text/javascript" src="/js/theodorus.js"></script>
                <script language="javascript" type="text/javascript" src="/js/utilities.js"></script>
                <xsl:for-each select="script">
                    <script language="javascript" type="text/javascript" src="{.}"></script>
                </xsl:for-each>
            </head>

            <body>
                <header>
                    <a href="/"><h1><span><xsl:value-of select="$app_name" /></span><sub>Beta</sub></h1></a>
                    <div class="intro_text"><xsl:value-of select="$text_intro" /></div>
                   <div id="account" class="account_menu">
                        <xsl:apply-templates select="//user" />
                    </div>
                    <nav class="nav_buttons">
                        <ul>
                            <li class="nav_blog"><a target="_blank" href="http://theodev.wordpress.com" accesskey="b"><xsl:value-of select="$nav_blog" /></a></li>
                            <li class="nav_features"><a href="https://trello.com/b/gtJnohoz/features" accesskey="t"><xsl:value-of select="$nav_features" /></a></li>
                            <li class="nav_sourcecode"><a href="https://github.com/odedshr/theodorus" accesskey="g"><xsl:value-of select="$nav_sourcecode" /></a></li>
                            <!-- li><a href="donations" accesskey="t"><xsl:value-of select="$nav_donations" /></a></li -->
                        </ul>
                    </nav>
                </header>
                <div id="main">
                    <xsl:apply-templates select="page"/>
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

    <xsl:template match="page[@type='message']">
        <div class="page_message">
            <h2><xsl:value-of select="$error_has_occoured" />: <xsl:apply-templates select="message" /></h2>
            <a href="{referer}"><xsl:value-of select="$previous_page" /></a>
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
</xsl:stylesheet>