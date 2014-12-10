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
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:template match="page[@type='feed']">
        <xsl:if test="//permissions/suggest = 'true'">
            <form id="form_add_topic" action="/topics" method="POST" class="form_add_topic">
                <textarea name="title" id="topic_title" class="topic_add_title" maxlength="140" required="required" pattern=".{{5,}}" placeholder="{$example_topic_title}" />
                <button id="button_suggest" accesskey="s" class="topic_add_submit"><xsl:value-of select="$btn_suggest" /></button>
            </form>
        </xsl:if>
        <div id="feed_wrapper" class="feed_wrapper">
            <div id="feed" class="feed">
                <div id="topics" class="topics">
                    <xsl:choose>
                        <xsl:when test="topics/topic">
                            <xsl:apply-templates select="topics" />
                            <div class="page-controls">
                                <xsl:choose>
                                    <xsl:when test="pageCount &gt; 1">
                                        <a class="nav-page-link nav-page-prev">
                                            <xsl:if test="pageIndex &gt; 1">
                                                <xsl:attribute name="href">/:<xsl:value-of select="pageIndex - 1" /></xsl:attribute>
                                            </xsl:if>
                                            <xsl:value-of select="$previous" />
                                        </a>

                                        <xsl:value-of select="$page" />
                                        <span class="nav-page-value"><xsl:value-of select="pageIndex" /></span>
                                        <xsl:value-of select="$out_of" />
                                        <span class="nav-page-value"><xsl:value-of select="pageCount" /></span>

                                        <a class="nav-page-link nav-page-next">
                                            <xsl:if test="pageIndex &lt; pageCount">
                                                <xsl:attribute name="href">/:<xsl:value-of select="pageIndex + 1" /></xsl:attribute>
                                            </xsl:if>
                                            <xsl:value-of select="$next" />
                                        </a>
                                    </xsl:when>
                                    <xsl:otherwise>
                                            <xsl:call-template name="string-replace-all">
                                                <xsl:with-param name="text"
                                                                select="$showing_x_items" />
                                                <xsl:with-param name="replace" select="$variable" />
                                                <xsl:with-param name="by" select="count(topics/topic)" />
                                            </xsl:call-template>
                                    </xsl:otherwise>
                                </xsl:choose>
                            </div>
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

    <xsl:template match="topic">
        <xsl:param name="profileImage">
            <xsl:choose>
                <xsl:when test="initiator/picture">/profileImage/<xsl:value-of select="initiator/picture"/></xsl:when>
                <xsl:otherwise>/ui/img/anonymous.png</xsl:otherwise>
            </xsl:choose>
        </xsl:param>

        <li class="topic">
            <a class="title-link" href="/topics/{topic_id}">
                <!-- xsl:if test="slug">
                    <xsl:attribute name="href">/*<xsl:value-of select="slug" /></xsl:attribute>
                </xsl:if-->
                <h3 class="title"><xsl:value-of select="title" /></h3>
            </a>

            <span class="hidden"> · </span>

            <div class="tags">
                <ul class="tag-list">
                    <xsl:for-each select="tags/tag[position() &lt;= 10]">
                        <li class="tag">
                            <span class="tag-label"><xsl:value-of select="tag" /></span>
                            <span class="tag-count"><xsl:value-of select="count" /></span>
                        </li>
                    </xsl:for-each>
                </ul>
            </div>
            <span class="hidden"> · </span>

            <a class="initiator"><img src="{$profileImage}" class="profile-image-mini" /><xsl:value-of select="initiator/display_name" /></a>
            <span class="hidden"> · </span>

            <xslt:call-template name="datetime-render">
                <xsl:with-param name="value" select="prettyCreated" />
            </xslt:call-template>

            <span class="hidden"> · </span>

            <div class="actions">
                <a class="statistics-item stat-opinion statistics-item-{opinion}" title="{comment} {$stat_comment}">
                    <span class="count"><xsl:value-of select="opinion" /></span>
                    <span class="hidden"> · </span>
                    <span class="item-label"><xsl:value-of select="$stat_opinion" /></span>
                </a>

                <span class="hidden"> · </span>

                <xsl:choose>
                    <xsl:when test="initiator/user_id = //user/user_id and endorse = 0 and follow = 0 and comment = 0">
                        <a class="statistics-item stat-endorse statistics-item-{endorse}">
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
                        <a class="statistics-item stat-endorse statistics-item-{endorse}">
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