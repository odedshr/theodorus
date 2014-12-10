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

        <xsl:template match="mainfeed">
            <noscript>
                <h1><xsl:value-of select="$javascript_disabled_title" /></h1>
                <div><xsl:value-of select="$javascript_disabled_instructions" /></div>
            </noscript>
            <header>
                <h1><span><xsl:value-of select="$app_name" /></span></h1>
            </header>
            <xsl:apply-templates />
        </xsl:template>

        <xsl:template match="page[@type='feed']">
            <header>
                <h1><span><xsl:value-of select="$app_name" /></span></h1>
                <div id="account">
                    <xsl:apply-templates select="user" />
                </div>
            </header>
            <div id="feed_wrapper">
                <div id="feed">
                    <div id="topics"><xsl:apply-templates select="topics" /></div>
                    <div id="sidebar">
                        <xsl:if test="addTopic">
                            <div id="suggest_topic">
                                <a id="link_suggest_topic" href="/topics/add" class="button" accesskey="a"><xsl:value-of select="$link_suggest_topic" /></a>
                            </div>
                        </xsl:if>
                        <div id="tags"><xsl:apply-templates select="tags" /></div>
                    </div>
                </div>
            </div>
        </xsl:template>

        <xsl:template match="addTopic">
            <form id="form_add_topic" action="/topics" method="POST">
                <div>
                    <label><xsl:value-of select="$lbl_topic_title" /></label>
                    <textarea name="title" id="topic_title" maxlength="140" required="required" pattern="{{5,}}" placeholder="{$example_topic_title}" />
                    <div><span id="topic_title_chars_left"/><span><xsl:value-of select="$characters_left" /></span></div>
                </div>
                <div>
                    <label><xsl:value-of select="$lbl_topic_slug" /></label>
                    <span id="topic_complete_slug">
                        <span id="slug_prefix"><xsl:value-of select="@prefix" /></span>
                        <input type="text" name="slug" id="slug" placeholder="{$example_topic_title_slug}" pattern="[a-zA-Z0-9\.\-_\$]{{0,140}}" />
                        <div id="slug_result" />
                    </span>
                </div>
                <div>
                    <label><xsl:value-of select="$lbl_topic_tags" /></label>
                    <input type="text" name="tags" id="topic_tags" placeholder="{$example_topic_tags}" />
                </div>
                <div>
                    <button id="button_suggest" accesskey="s"><xsl:value-of select="$btn_suggest" /></button>
                    <button id="button_cancel" type="reset" accesskey="x"><xsl:value-of select="$btn_cancel" /></button>
                </div>
            </form>
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
            <li class="topic">
                <h2><a class="title" href="/*{topic_id}">
                    <xsl:if test="slug">
                        <xsl:attribute name="href">/*<xsl:value-of select="slug" /></xsl:attribute>
                    </xsl:if>
                    <xsl:value-of select="title" />
                </a></h2>
                <a class="inititiator"><xsl:value-of select="initiator/display_name" /></a>

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


                <h5><xsl:value-of select="$lbl_topic_tags" /></h5>
                <ul class="tags">
                    <xsl:for-each select="tags/tag">
                        <li class="tag">
                            <span class="tag-color" style="background-color:{color}">&nbsp;</span>
                            <xsl:value-of select="current()" />
                        </li>
                    </xsl:for-each>
                </ul>
                <h5><xsl:value-of select="$lbl_topic_feedback" /></h5>
                <xsl:choose>
                    <xsl:when test="//permissions/feedback/true">
                        <ul class="feedback">
                            <li>
                                <a class="button-action" href="{url}/endorse">
                                    <xsl:if test="endorse/@me = 'true'">
                                        <xsl:attribute name="href">/<xsl:value-of select="url"/>/unendorse</xsl:attribute>
                                        <xsl:attribute name="class">button-action pressed</xsl:attribute>
                                    </xsl:if>
                                    <xsl:value-of select="$btn_send_endorse" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="endorse" /></span>
                                </a>
                            </li>
                            <li>
                                <a class="button-action" href="{url}/follow">
                                    <xsl:if test="follow/@me = 'true'">
                                        <xsl:attribute name="href">/<xsl:value-of select="url"/>/unfollow</xsl:attribute>
                                        <xsl:attribute name="class">button-action pressed</xsl:attribute>
                                    </xsl:if>
                                    <xsl:value-of select="$btn_send_follow" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="follow" /></span>
                                </a>
                            </li>
                            <li>
                                <a class="button-action" href="{url}/report">
                                    <xsl:if test="report/@me = 'true'">
                                        <xsl:attribute name="href">/<xsl:value-of select="url"/>/unreport</xsl:attribute>
                                        <xsl:attribute name="class">button-action pressed</xsl:attribute>
                                    </xsl:if>
                                    <xsl:value-of select="$btn_send_report" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="report" /></span>
                                </a>
                            </li>
                            <li>
                                <a class="button-action" href="{url}/comment">
                                    <xsl:value-of select="$btn_send_comment" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="comment" /></span>
                                </a>
                            </li>
                        </ul>
                    </xsl:when>
                    <xsl:otherwise>
                        <ul class="feedback">
                            <li>
                                <span><xsl:value-of select="$btn_endorse" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="endorse" /></span></span>
                            </li>
                            <li>
                                <span><xsl:value-of select="$btn_follow" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="follow" /></span></span>
                            </li>
                            <li>
                                <span><xsl:value-of select="$btn_report" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="report" /></span></span>
                            </li>
                            <li>
                                <span><xsl:value-of select="$btn_comment" /><span class="hidden"> · </span><span class="count"><xsl:value-of select="comment" /></span></span>
                            </li>
                        </ul>
                    </xsl:otherwise>
                </xsl:choose>

            </li>
        </xsl:template>
    </xsl:stylesheet>