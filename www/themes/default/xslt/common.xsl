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
                <xsl:apply-templates select="script" />
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

    <xsl:template match="script">
        <script language="javascript" type="text/javascript" src="{@src}"></script>
    </xsl:template>

    <xsl:template match="message[@type='error']">
        <xsl:variable name="vSelector" select="@message"/>
        <xsl:variable name="errorMessage" select="exslt:node-set($errorMessages)/*[@type=$vSelector]"/>
        <xsl:choose>
            <xsl:when test="count(exslt:node-set($errorMessages)/*[@type=$vSelector]) &gt; 0">
                <xsl:value-of select="$errorMessage"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$err_unknown_error" /> (<xsl:value-of select="@message" />)
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
                <xsl:value-of select="$err_unknown_error" /> (<xsl:value-of select="@message" />)
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