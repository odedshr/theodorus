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
    <xsl:output method="html" encoding="UTF-8"/>

    <!--xsl:template match="mainfeed">
        <noscript>
            <h1><xsl:value-of select="$javascript_disabled_title" /></h1>
            <div><xsl:value-of select="$javascript_disabled_instructions" /></div>
        </noscript>
        <header>
            <h1><span><xsl:value-of select="$app_name" /></span></h1>
        </header>
        <xsl:apply-templates />
    </xsl:template -->

    <xsl:template match="page[@type='feed']">
        <xsl:if test="//permissions/suggest = 'true'">
            <form id="form_add_topic" action="/topics" method="POST" class="form_add_topic">
                <div>
                    <textarea name="title" id="topic_title" maxlength="140" required="required" pattern=".{{5,}}" placeholder="{$example_topic_title}" />
                    <button id="button_suggest" accesskey="s"><xsl:value-of select="$btn_suggest" /></button>
                </div>
            </form>
        </xsl:if>
        <div id="feed_wrapper" class="feed_wrapper">
            <div id="feed" class="feed">
                <div id="topics" class="topics">
                    <xsl:choose>
                        <xsl:when test="topics/topic">
                            <xsl:apply-templates select="topics" />
                        </xsl:when>
                        <xsl:otherwise>
                            <div class="no-topics">
                                <xsl:value-of select="$lbl_no_topics_found" />&nbsp;
                                <xsl:if test="//permissions/suggest = 'true'">
                                    <xsl:value-of select="$lbl_no_topics_found_suggest_one" />
                                </xsl:if>
                            </div>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>
            </div>
        </div>
    </xsl:template>

    <xsl:template match="slugTest">
        <xsl:variable name="vSelector" select="@result"/>
        <xsl:variable name="resultMessage" select="exslt:node-set($slugResults)/*[@type=$vSelector]"/>
        <xsl:if test="count(exslt:node-set($slugResults)/*[@type=$vSelector]) &gt; 0">
            <xsl:value-of select="$resultMessage"/>
        </xsl:if>
    </xsl:template>

    <xsl:template match="tags">
        <h2><xsl:value-of select="$lbl_tags" /></h2>
        <ul>
            <xsl:apply-templates select="tag">
                <xsl:sort select="count" data-type="number" order="descending"/>
            </xsl:apply-templates>
        </ul>
    </xsl:template>

    <xsl:template match="tag">
        <li class="tag-wrapper">
            <div class="tag">
                <span class="tag-color" style="background-color:{color}">&nbsp;</span>
                <a href="/#{current()}"><xsl:value-of select="tag" /></a>
            </div>
            <xsl:if test="count &gt; 0">
                <span class="tag-count"><xsl:value-of select="count" /></span>
            </xsl:if>
        </li>
    </xsl:template>

    <xsl:template match="topics">
        <ul>
            <xsl:apply-templates select="topic" />
        </ul>
    </xsl:template>

    <!-- title as a link:
    <a class="title" href="/topics/{topic_id}">
                <xsl:if test="slug">
                    <xsl:attribute name="href">/*<xsl:value-of select="slug" /></xsl:attribute>
                </xsl:if>
                <h2><xsl:value-of select="title" /></h2>
            </a>
    -->
    <xsl:template match="topic">
        <li class="topic">
            <a class="title"><h2><xsl:value-of select="title" /></h2> </a>
            <a class="initiator"><xsl:value-of select="initiator/display_name" /></a>
            <span class="hidden"> · </span>
            <xsl:choose>
                <xsl:when test="created/pattern">
                    <xsl:variable name="vSelector" select="created/pattern"/>
                    <!--<xsl:variable name="prettyCreated" select="exslt:node-set($timestamps)/*[@id=$vSelector]"/> -->
                    <xsl:variable name="prettyCreated">
                        <xsl:call-template name="string-replace-all">
                            <xsl:with-param name="text" select="exslt:node-set($timestamps)/*[@id=$vSelector]" />
                            <xsl:with-param name="replace" select="'#'" />
                            <xsl:with-param name="by" select="created/patternValue" />
                        </xsl:call-template>
                    </xsl:variable>
                    <time class="created" datetime="{created/timestamp}" title="{created/formatted}"><xsl:value-of select="$prettyCreated" /></time>
                </xsl:when>
                <xsl:otherwise>
                    <time class="created" datetime="{created/timestamp}" title="{created/formatted}"><xsl:value-of select="created/formatted" /></time>
                </xsl:otherwise>
            </xsl:choose>
            <span class="hidden"> · </span>
            <div class="actions">
                <xsl:choose>
                    <xsl:when test="initiator/user_id = //user/user_id and endorse = 0 and follow = 0 and comment = 0">
                        <a class="statistics-item stat-endorse">
                            <span class="count"><xsl:value-of select="endorse" /></span>
                            <span class="hidden"> · </span>
                            <span class="item-label"><xsl:value-of select="$stat_endorse" /></span>
                        </a>
                        <a class="button-action" href="/topics/{topic_id}/remove"><xsl:value-of select="$btn_remove" /></a>
                    </xsl:when>
                    <xsl:when test="initiator/user_id != //user/user_id">
                        <a class="button-action button-endorse" href="/topics/{topic_id}/endorse">
                            <xsl:if test="user_endorse = '1'">
                                <xsl:attribute name="href">/topics/<xsl:value-of select="topic_id"/>/unendorse</xsl:attribute>
                                <xsl:attribute name="class">button-action pressed</xsl:attribute>
                            </xsl:if>
                            <span class="count"><xsl:value-of select="endorse" /></span>
                            <span class="hidden"> · </span>
                            <span class="item-label"><xsl:value-of select="$btn_endorse" /></span>
                        </a>
                    </xsl:when>
                    <xsl:otherwise>
                        <a class="statistics-item stat-endorse">
                            <span class="count"><xsl:value-of select="endorse" /></span>
                            <span class="hidden"> · </span>
                            <span class="item-label"><xsl:value-of select="$stat_endorse" /></span>
                        </a>
                    </xsl:otherwise>
                </xsl:choose>
            </div>
        </li>
    </xsl:template>
</xsl:stylesheet>