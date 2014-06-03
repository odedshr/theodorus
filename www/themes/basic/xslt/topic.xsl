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
                <button id="button_suggest" accesskey="s"><xsl:value-of select="$btn_suggest" /></button>
                <button id="button_cancel" type="reset" accesskey="x"><xsl:value-of select="$btn_cancel" /></button>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="page[@type='topicView']">
        <div id="topic" class="topic-view">
            <a href="{//referer}" class="button-back" onclick="history.go(-1);return false;"><xsl:value-of select="$back" /></a>
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

            <xsl:if test="topic/tags/tag or //user/user_id">
                <div class="tags">
                    <a name="tags" class="tags-title"><xsl:value-of select="$lbl_tags"/></a>

                    <ul class="tag-list">
                        <xsl:for-each select="topic/tags/tag[position() &lt;= 10]">
                            <li class="tag">
                                <span class="tag-label"><xsl:value-of select="tag" /></span>
                                <span class="tag-count"><xsl:value-of select="count" /></span>
                            </li>
                        </xsl:for-each>
                    </ul>

                    <xsl:if test="//user/user_id">
                        <form id="tags" class="tags-edit" action="/topics/{topic/topic_id}/tags" method="post">
                            <label class="instructions"><xsl:value-of select="$lbl_tags_instructions"/></label>
                            <input id="tags" name="tags" class="tags-field" type="text" value="{userTopicTags}" placeholder="{$lbl_tags_placeholder}" title="{$lbl_tags_instructions}" pattern="([^#\/:\s](\s?,\s)?)+"/>
                            <button id="button_update_tags" accesskey="t"><xsl:value-of select="$btn_update_tags" /></button>
                        </form>
                    </xsl:if>
                </div>
            </xsl:if>


            <form id="comments" class="comments" action="/topics/{topic/topic_id}/comment" method="post">
                <input type="hidden" name="topic_id" value="{topic/topic_id}" />

                <xsl:choose>
                    <!-- User have opinion-->
                    <xsl:when test="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]">
                        <!-- my opinion -->
                        <xsl:call-template name="comments">
                            <xsl:with-param name="comment" select="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]" />
                            <xsl:with-param name="is_root" select="true()" />
                        </xsl:call-template>

                        <xsl:choose>
                            <xsl:when test="comments/comment[commenter/user_id != //user/user_id]">
                                <div class="other-opinions">
                                    <a name="other-opinions" class="other-opinions-title"><xsl:value-of select="$other_opinions" /></a>
                                    <xsl:call-template name="comments">
                                        <xsl:with-param name="comment" select="comments/comment[commenter/user_id != //user/user_id and parent_id = 0]" />
                                        <xsl:with-param name="is_root" select="true()" />
                                    </xsl:call-template>
                                </div>
                            </xsl:when>
                            <xsl:otherwise test="comments/comment[commenter/user_id = //user/user_id and parent_id = 0]">
                                <div class="no-comments"><xsl:value-of select="$no_other_opinions" /></div>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:when>
                    <xsl:when test="//user/user_id">
                        <!-- ask user opinion -->
                        <xsl:call-template name="comment-box">
                            <xsl:with-param name="parent_id" select="0" />
                            <xsl:with-param name="original" select="empty" />
                        </xsl:call-template>
                        <xsl:choose>
                            <xsl:when test="comments/comment[commenter/user_id != //user/user_id]"> <!---->
                                <div class="other-opinions">
                                    <a name="other-opinions" class="other-opinions-title"><xsl:value-of select="$opinions" /></a>
                                    <xsl:call-template name="comments">
                                        <xsl:with-param name="comment" select="comments/comment[commenter/user_id != //user/user_id]" />
                                        <xsl:with-param name="is_root" select="true()" />
                                    </xsl:call-template>
                                </div>
                            </xsl:when>
                            <xsl:otherwise>
                                <div class="no-comments"><xsl:value-of select="$no_opinions" /></div>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:when>
                    <xsl:otherwise>
                        <!-- anonymous user-->
                        <xsl:choose>
                            <xsl:when test="comments/comment"> <!---->
                                <div class="opinions">
                                    <a name="other-opinions" class="other-opinions-title"><xsl:value-of select="$opinions" /></a>
                                    <xsl:call-template name="comments">
                                        <xsl:with-param name="comment" select="comments/comment" />
                                        <xsl:with-param name="is_root" select="true()" />
                                    </xsl:call-template>
                                </div>
                            </xsl:when>
                            <xsl:otherwise>
                                <div class="no-comments"><xsl:value-of select="$no_opinions" /></div>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:otherwise>
                </xsl:choose>
            </form>
        </div>
    </xsl:template>

    <xsl:template name="comments">
        <xsl:param name="comment"/>
        <xsl:param name="is_root"/>
        <ul class="comment-list">
            <xsl:for-each select="$comment">
                <xsl:call-template name="comment">
                    <xsl:with-param name="comment" select="." />
                    <xsl:with-param name="is_root" select="$is_root" />
                 </xsl:call-template>
            </xsl:for-each>
        </ul>
    </xsl:template>

    <xsl:template name="comment">
        <xsl:param name="comment"/>
        <xsl:param name="is_root"/>
        <xsl:param name="is_mine" select="$comment/commenter/user_id = //user/user_id"/>
        <xsl:param name="profileImage">
            <xsl:choose>
                <xsl:when test="$comment/commenter/picture">/profileImage/<xsl:value-of select="$comment/commenter/picture"/></xsl:when>
                <xsl:otherwise>/ui/img/anonymous.png</xsl:otherwise>
            </xsl:choose>
        </xsl:param>

        <li class="comment">
            <xsl:if  test="$comment/parent_id = 0">
                <xsl:attribute name="class">comment opinion</xsl:attribute>
            </xsl:if>
            <a name="comment:{$comment/comment_id}" id="comment:{$comment/comment_id}" />
            <a class="commenter">
                <img src="{$profileImage}" class="profile-image-mini" />
                <xsl:choose>
                    <xsl:when test="$is_mine = 'true' and $is_root = 'true'">
                        <xsl:value-of select="$your_opinion" />
                        <span class="text-wrapper-from">
                            <xslt:call-template name="datetime-render">
                                <xsl:with-param name="value" select="created" />
                            </xslt:call-template>
                        </span>
                        <xslt:call-template name="endorse">
                            <xsl:with-param name="count" select="$comment/endorse" />
                            <xsl:with-param name="user_endorse" select="false()"/>
                        </xslt:call-template>
                    </xsl:when>
                    <xsl:otherwise><xsl:value-of select="$comment/commenter/display_name" /></xsl:otherwise>
                </xsl:choose>
            </a>
            <xsl:choose>
                <xsl:when test="$is_mine and $is_root and not(//commentId)" >
                    <xsl:call-template name="comment-box">
                        <xsl:with-param name="parent_id" select="0" />
                        <xsl:with-param name="original" select="$comment/content" />
                    </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                    <h3 class="comment-content"><xsl:value-of select="$comment/content" /></h3>
                </xsl:otherwise>
            </xsl:choose>

            <span class="hidden"> · </span>

            <div class="actions">
                <xsl:choose>
                    <xsl:when test="$is_mine and $is_root and not(//commentId)">
                        <xsl:if test="$comment/endorse = 0 and $comment/follow = 0 and count($comment/comments/comment[not(commenter/user_id = //user/user_id)]) = 0">
                            <a class="button-action" href="/topics/{//topic/topic_id}/comments/{$comment/comment_id}/remove"><xsl:value-of select="$btn_remove" /></a>
                        </xsl:if>
                    </xsl:when>
                    <xsl:otherwise>
                        <xslt:call-template name="datetime-render">
                            <xsl:with-param name="value" select="created" />
                        </xslt:call-template>

                        <span class="hidden"> · </span>

                        <xsl:choose>
                            <xsl:when test="$comment/commenter/user_id != //user/user_id">
                                <xslt:call-template name="endorse">
                                    <xsl:with-param name="count" select="$comment/endorse" />
                                    <xsl:with-param name="user_endorse" select="user_endorse"/>
                                </xslt:call-template>
                            </xsl:when>
                            <xsl:otherwise>
                                <xslt:call-template name="endorse">
                                    <xsl:with-param name="count" select="$comment/endorse" />
                                    <xsl:with-param name="user_endorse" select="false()"/>
                                </xslt:call-template>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:otherwise>
                </xsl:choose>

                <xsl:choose>
                    <xsl:when test="//user/user_id and //commentId = comment_id" >
                        <xsl:call-template name="comment-box">
                            <xsl:with-param name="parent_id" select="comment_id" />
                            <xsl:with-param name="original" select="empty" />
                        </xsl:call-template>
                    </xsl:when>
                    <xsl:when test="//user/user_id and not($is_mine)">
                        <a class="button-action" href="/topics/{//topic/topic_id}/comments/{comment_id}#add_comment"><xsl:value-of select="$btn_add_comment" /></a>
                    </xsl:when>
                    <xsl:when test="$is_mine and $is_root and //commentId" >
                        <a class="button-action" href="/topics/{//topic/topic_id}"><xsl:value-of select="$btn_update_comment" /></a>
                    </xsl:when>
                </xsl:choose>
            </div>

            <span class="hidden"> · </span>

            <xsl:if test="$comment/comments">
                <xsl:call-template name="comments">
                    <xsl:with-param name="comment" select="$comment/comments/comment" />
                    <xsl:with-param name="is_root" select="false()" />
                </xsl:call-template>
            </xsl:if>
        </li>
    </xsl:template>

    <xsl:template name="endorse">
        <xsl:param name="count" />
        <xsl:param name="user_endorse" />

        <xsl:choose>
            <xsl:when test="$user_endorse != false()">
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
                <span class="statistics-item stat-endorse">
                    <span class="count"><xsl:value-of select="$count" /></span>
                    <span class="hidden"> · </span>
                    <span class="item-label"><xsl:value-of select="$stat_endorse" /></span>
                </span>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template name="comment-box">
        <xsl:param name="parent_id" />
        <xsl:param name="original" />

        <div class="comment-box">
            <xsl:if test="$original">
                <xsl:attribute name="class">comment-box update-opinion-box</xsl:attribute>
            </xsl:if>
            <a name="add_comment" />
            <textarea name="comment_on-{$parent_id}" maxlength="140" class="comment-box-element comment-new"><xsl:value-of select="$original"/></textarea>
            <input type="hidden" value="{//referer}" name="referer" id="referer" />
            <button name="parent_id" value="{$parent_id}" class="comment-box-element comment-submit">
                <span>
                    <xsl:choose>
                        <xsl:when test="$original"><xsl:value-of select="$update_comment" /></xsl:when>
                        <xsl:otherwise><xsl:value-of select="$add_comment" /></xsl:otherwise>
                    </xsl:choose>
                </span>
            </button>
        </div>
    </xsl:template>
</xsl:stylesheet>