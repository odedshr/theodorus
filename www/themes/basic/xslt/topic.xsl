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

    <xsl:template match="page[@type='addTopic']">
        <form id="form_add_topic" action="/topics" method="POST" class="page-content">
            <div>
                <label><xsl:value-of select="$lbl_topic_title" /></label>
                <textarea name="title" id="topic_title" maxlength="140" required="required" pattern=".{{5,}}" placeholder="{$example_topic_title}" />
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

    <xsl:template match="page[@type='topicView']">
        <div id="topic" class="topic-view">
            <xsl:choose>
                <xsl:when test="topicLoading">
                    <div id="loading_system"><xsl:value-of select="$system_loading" /></div>
                </xsl:when>
                <xsl:when test="topic">
                    <a href="{//referer}" class="button-back"><xsl:value-of select="$back" /></a>
                    <h2><xsl:value-of select="topic/title" /></h2>
                    <div id="content"><xsl:value-of select="topic/content" /></div>
                    <!--<xsl:choose>
                        <xsl:when test="topic[status='idea']">idea</xsl:when>
                        <xsl:when test="topic[status='discussion']">discussion</xsl:when>
                        <xsl:when test="topic[status='proposition']">proposition</xsl:when>
                        <xsl:when test="topic[status='decision']">decision</xsl:when>
                    </xsl:choose>-->
                    <ul id="socialTools" class="socialTools">
                        <li class="socialTool twitter">
                            <a href="https://twitter.com/share" class="twitter-share-button" data-text="{topic/title}"><xsl:value-of select="$tweet"/></a>
                            <script>!function(d,s,id){
                                    var js,
                                        fjs=d.getElementsByTagName(s)[0],
                                        p= /^http:/.test(d.location)?'http':'https';
                                        if(!d.getElementById(id)){
                                            js=d.createElement(s);
                                            js.id=id;
                                            js.src=p+'://platform.twitter.com/widgets.js';
                                            fjs.parentNode.insertBefore(js,fjs);
                                        }
                                        }(document, 'script', 'twitter-wjs');</script>
                        </li>
                        <li class="socialTool google">
                            <div class="g-plusone" />
                            <script type="text/javascript">
                                (function() {
                                    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                                    po.src = 'https://apis.google.com/js/plusone.js';
                                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
                                })();
                            </script>
                        </li>
                        <li class="socialTool facebook">
                            <iframe src="//www.facebook.com/plugins/like.php?href={//server}/topics/{topic/topic_id}&amp;width=450&amp;height=21&amp;colorscheme=light&amp;layout=button_count&amp;action=like&amp;show_faces=true&amp;send=false&amp;appId=1394431237451482"
                                    scrolling="no"
                                    allowTransparency="true" />
                        </li>
                    </ul>
                    <form id="comments" class="comments" action="/topics/{topic/topic_id}/comment" method="post">
                        <input type="hidden" name="topic_id" value="{topic/topic_id}" />

                        <xsl:choose>
                            <!-- User have opinion-->
                            <xsl:when test="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]">
                                <xsl:apply-templates select="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]" />

                                <xsl:choose>
                                    <xsl:when test="comments/comment">
                                        <div class="other-opinions">
                                            <a name="other-opinions" class="other-opinions-title"><xsl:value-of select="$other_opinions" /></a>
                                            <xsl:apply-templates select="comments" />
                                        </div>
                                    </xsl:when>
                                    <xsl:otherwise test="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]">
                                        <div class="no-comments"><xsl:value-of select="$no_other_opinions" /></div>
                                    </xsl:otherwise>
                                </xsl:choose>
                            </xsl:when>
                            <xsl:otherwise>
                                <!-- User doesn't have an opinion-->
                                <xsl:if test="//user/user_id">
                                    <!-- User not signed in-->
                                    <xsl:call-template name="comment-box">
                                        <xsl:with-param name="parent_id" select="0" />
                                    </xsl:call-template>
                                </xsl:if>
                                <xsl:choose>
                                    <xsl:when test="comments/comment">
                                        <div class="other-opinions">
                                            <a name="other-opinions" class="other-opinions-title"><xsl:value-of select="$opinions" /></a>
                                            <xsl:apply-templates select="comments" />
                                        </div>
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <div class="no-comments"><xsl:value-of select="$no_opinions" /></div>
                                    </xsl:otherwise>
                                </xsl:choose>
                            </xsl:otherwise>
                        </xsl:choose>
                    </form>
                </xsl:when>
                <xsl:when test="message">
                    <div><xsl:value-of select="$file_not_found_title" /></div>
                    <div><xsl:value-of select="$file_not_found-what_to_do" /></div>
                </xsl:when>
                <xsl:otherwise>
                    <div><xsl:value-of select="$failed_to_load_topic" /></div>
                </xsl:otherwise>
            </xsl:choose>
        </div>
    </xsl:template>

    <xsl:template match="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]">
        <div class="comment your-comment">
            <a name="comment:{comment_id}" id="comment:{comment_id}" />
            <a class="commenter"><xsl:value-of select="$your_opinion" /></a>

            <span class="hidden"> · </span>

            <div class="actions">
                <xslt:call-template name="datetime-render">
                    <xsl:with-param name="value" select="created" />
                </xslt:call-template>

                <span class="hidden"> · </span>
                <xsl:choose>
                    <xsl:when test="commenter/user_id = //user/user_id and endorse = 0 and follow = 0 and count(comments/comment) = 0">
                        <a class="statistics-item stat-endorse">
                            <span class="count"><xsl:value-of select="endorse" /></span>
                            <span class="hidden"> · </span>
                            <span class="item-label"><xsl:value-of select="$stat_endorse" /></span>
                        </a>
                        <a class="button-action" href="/topics/{//topic/topic_id}/comments/{comment_id}/remove"><xsl:value-of select="$btn_remove" /></a>
                    </xsl:when>
                    <xsl:when test="commenter/user_id != //user/user_id">
                        <a class="button-action button-endorse" href="/topics/{comment_id}/endorse">
                            <xsl:if test="user_endorse = '1'">
                                <xsl:attribute name="href">/topics/<xsl:value-of select="comment_id"/>/unendorse</xsl:attribute>
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

            <span class="hidden"> · </span>
            <xsl:if test="//user/user_id">
                <div class="comment-box">
                    <textarea name="comment_on-0" maxlength="140" class="comment-box-element comment-new"><xsl:value-of select="content" /></textarea>
                    <button name="comment_id" value="{comment_id}" class="comment-box-element comment-submit"><span><xsl:value-of select="$update_comment" /></span></button>
                </div>
            </xsl:if>
            <span class="hidden"> · </span>
            <xsl:apply-templates select="comments" />
        </div>
    </xsl:template>

    <xsl:template match="comments">
        <ul class="comment-list"><xsl:apply-templates select="comment[not(commenter/user_id = //user/user_id and parent_id = 0)]" /></ul>
    </xsl:template>

    <xsl:template match="comment">
            <li class="comment">
                <a name="comment:{comment_id}" id="comment:{comment_id}" />
                <a class="commenter"><xsl:value-of select="commenter/display_name" /></a>
                <h3 class="comment-content"><xsl:value-of select="content" /></h3>
                <span class="hidden"> · </span>

                <div class="actions">
                    <xslt:call-template name="datetime-render">
                        <xsl:with-param name="value" select="created" />
                    </xslt:call-template>

                    <span class="hidden"> · </span>
                    <xsl:choose>
                        <xsl:when test="commenter/user_id = //user/user_id and endorse = 0 and follow = 0 and count(comments/comment) = 0">
                            <a class="statistics-item stat-endorse">
                                <span class="count"><xsl:value-of select="endorse" /></span>
                                <span class="hidden"> · </span>
                                <span class="item-label"><xsl:value-of select="$stat_endorse" /></span>
                            </a>
                            <a class="button-action" href="/topics/{//topic/topic_id}/comments/{comment_id}/remove"><xsl:value-of select="$btn_remove" /></a>
                        </xsl:when>
                        <xsl:when test="commenter/user_id != //user/user_id">
                            <a class="button-action button-endorse" href="/topics/{comment_id}/endorse">
                                <xsl:if test="user_endorse = '1'">
                                    <xsl:attribute name="href">/topics/<xsl:value-of select="comment_id"/>/unendorse</xsl:attribute>
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

                    <xsl:choose>
                        <xsl:when test="//user/user_id and //commentId = comment_id" >
                            <xsl:call-template name="comment-box">
                                <xsl:with-param name="parent_id" select="comment_id" />
                            </xsl:call-template>
                        </xsl:when>
                        <xsl:when test="//user/user_id">
                            <a class="button-action" href="/topics/{//topic/topic_id}/comments/{comment_id}#add_comment"><xsl:value-of select="$btn_add_comment" /></a>
                        </xsl:when>
                    </xsl:choose>

                </div>
                <xsl:apply-templates select="comments" />

            </li>
    </xsl:template>

    <xsl:template name="comment-box">
        <xsl:param name="parent_id" />
        <div class="comment-box">
            <a name="add_comment" />
            <xsl:if test="$parent_id = 0">
                <a class="commenter"><xsl:value-of select="$your_opinion" /></a>
            </xsl:if>
            <textarea name="comment_on-{$parent_id}" maxlength="140" class="comment-box-element comment-new"></textarea>
            <input type="hidden" value="{//referer}" name="referer" id="referer" />
            <button name="parent_id" value="{$parent_id}" class="comment-box-element comment-submit"><span><xsl:value-of select="$add_comment" /></span></button>
        </div>
    </xsl:template>
</xsl:stylesheet>