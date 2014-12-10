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
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:template match="user">
        <xsl:param name="profileImage">
            <xsl:choose>
                <xsl:when test="picture">/profileImage/<xsl:value-of select="picture"/></xsl:when>
                <xsl:otherwise>/ui/img/anonymous.png</xsl:otherwise>
            </xsl:choose>
        </xsl:param>

        <xsl:choose>
            <xsl:when test="user_id">
                <img src="{$profileImage}" class="profile-image-mini" />
                <a id="user_name" class="user_name" href="/me"><xsl:value-of select="display_name" /></a>
                <span class="separator"> | </span>
                <a id="btn_signout" class="button-signout" href="/signout" title="Sign out"><xsl:value-of select="$btn_signout" /></a>
            </xsl:when>
            <xsl:otherwise>
                <a id="btn_signup" class="button btn_signup" href="/signup"><xsl:value-of select="$btn_signup" /></a><span class="separator"> | </span><a id="btn_signin" class="button btn_signin" href="/signin"><xsl:value-of select="$btn_signin" /></a>

                <!--a id="signin-google" class="button-signin" href="/?signin/google" target="_blank">Google</a>
                <a id="signin-facebook" class="button-signin" href="/?signin/facebook" target="_blank">Facebook</a-->
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="notification_counter">
        notification_counter
    </xsl:template>

    <xsl:template match="notification_list">
        notification_list
    </xsl:template>

    <xsl:template match="notification">
        notification
    </xsl:template>


    <xsl:template match="page[@type='signin']">
        <form id="form_signin" action="/signin" method="post" class="page_form form_authentication form_signin">
            <h2><xsl:value-of select="$welcome_back" /></h2>
            <div>
                <label><xsl:value-of select="$lbl_email" /></label>
                <input type="email" id="email" name="email" required="required"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_password" /></label>
                <input type="password" id="password" name="password" required="required"/>
                <input type="hidden" id="md5" name="md5" value="false"/>
                <a href="/resetPassword" class="link-forgot-password"><xsl:value-of select="$lbl_forgot_password" /></a>
            </div>
            <div>
                <input type="checkbox" id="remember" name="remember" value="true"/>
                <label><xsl:value-of select="$lbl_remember_me" /></label>
            </div>
            <div class="form-buttons">
                <input type="hidden" id="referer" name="referer" value="{//app/page/referer}" />
                <button id="button-signin" type="submit"><xsl:value-of select="$btn_submit_signin" /></button>
                <!--button id="button-cancel" type="reset"><xsl:value-of select="$btn_cancel" /></button-->
                <a href="{//app/page/referer}" class="button-cancel" onclick="history.go(-1);return false;"><xsl:value-of select="$btn_cancel" /></a>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="page[@type='confirm-email']">
        <form id="form_signup" action="/signup" method="post" class="page_form form_authentication form_signup">
            <h2><xsl:value-of select="$welcome" /></h2>
            <div class="signup-confirm-mail-intro"><xsl:value-of select="$explain_confirm_email" /></div>
            <div>
                <label><xsl:value-of select="$lbl_email" /></label>
                <input type="email" id="email" name="email" required="required" placeholder="{$lbl_email_example}"/>
            </div>
            <div class="form-buttons">
                <button id="button-signup" type="submit"><xsl:value-of select="$btn_submit_signup" /></button>
                <a href="{//app/page/referer}" class="button-cancel" onclick="history.go(-1);return false;"><xsl:value-of select="$btn_cancel" /></a>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="page[@type='confirm-email-sent']">
        <div class="page_form page-confirm-email-sent">
            <h2><xsl:value-of select="$lbl_confirm_email_sent" /></h2>
            <ul class="notes">
                <li class="note"><xsl:value-of select="$explain_confirm_email_check_email" /></li>
                <li class="note"><xsl:value-of select="$explain_confirm_email_check_spam" /></li>
            </ul>
            <a href="/" class="button-back"><xsl:value-of select="$back_to_main_page" /></a>
        </div>
    </xsl:template>

    <xsl:template match="page[@type='signup']">
        <form id="form_signup" action="/signup" method="post" class="page_form form_authentication form_signup">
            <input type="hidden" id="email" name="email" value="{email}"/>

            <h2><xsl:value-of select="$almost_completed" /></h2>
            <div>
                <label><xsl:value-of select="$lbl_name" /></label>
                <input type="text" id="name" name="name" required="required" pattern=".{{4,}}" placeholder="{$lbl_name_example}" value="{name}" />
            </div>
            <div>
                <label><xsl:value-of select="$lbl_password" /></label>
                <input type="password" id="password" name="password" required="required" pattern=".{{3,}}" value="{password}"/>
                <input type="hidden" id="md5" name="md5" value="false"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_repeat_password" /></label>
                <input type="password" id="password_repeat" name="password_repeat" required="required" value="{password_repeat}"/>
            </div>
            <div class="terms_of_use">
                <input type="checkbox" id="terms_of_use" name="terms_of_use" required="required">
                <xsl:if test="terms_of_use">
                    <xsl:attribute name="checked">checked</xsl:attribute>
                </xsl:if>
                </input>
                <label><xsl:value-of select="$lbl_terms_of_use" /></label>
                <div id="terms-of-use" class="terms_of_use_details"><xsl:copy-of select="$terms_of_use" /></div>
            </div>
            <div class="form-buttons">
                <button id="button-signup" type="submit"><xsl:value-of select="$btn_submit_signup" /></button>
                <!--button id="button-cancel" type="reset"><xsl:value-of select="$btn_cancel" /></button-->
            </div>
        </form>
    </xsl:template>

    <xsl:template match="page[@type='forgot-password']">
        <form id="form_signup" action="/resetPassword" method="post" class="page_form form_authentication form_forgotPassword">
            <h2><xsl:value-of select="$title_forgotPassword" /></h2>
            <div class="forgotPassword-intro"><xsl:value-of select="$explain_forgot_password" /></div>
            <div>
                <label><xsl:value-of select="$lbl_email" /></label>
                <input type="email" id="email" name="email" required="required" placeholder="{$lbl_email_example}"/>
            </div>
            <div class="form-buttons">
                <button id="button-signup" type="submit"><xsl:value-of select="$btn_send_link" /></button>
                <a href="/signin" class="button-cancel" onclick="history.go(-1);return false;"><xsl:value-of select="$btn_cancel" /></a>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="page[@type='change-password']">
        <form id="form_signup" action="/password" method="post" class="page_form form_authentication change_resetPassword">
            <input type="hidden" id="email" name="email" value="{email}"/>
            <input type="hidden" id="hash" name="hash" value="{hash}"/>

            <h2><xsl:value-of select="$title_change_password" /></h2>
            <xsl:if test="not(hash) or hash = ''">
                <div>
                    <label><xsl:value-of select="$lbl_current_password" /></label>
                    <input type="password" id="oldPassword" name="old_password" required="required" pattern=".{{3,}}" value="{old_password}"/>
                </div>
            </xsl:if>
            <div>
                <label><xsl:value-of select="$lbl_password" /></label>
                <input type="password" id="password" name="password" required="required" pattern=".{{3,}}" value="{password}"/>
                <input type="hidden" id="md5" name="md5" value="false"/>
            </div>
            <div>
                <label><xsl:value-of select="$lbl_repeat_password" /></label>
                <input type="password" id="password_repeat" name="password_repeat" required="required" value="{password_repeat}"/>
            </div>
            <div class="form-buttons">
                <button id="button-reset-password" type="submit"><xsl:value-of select="$btn_update_password" /></button>
                <a href="/signin" class="button-cancel"><xsl:value-of select="$btn_cancel" /></a>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="page[@type='signout']">
        <div class="page_form">
            <h2><xsl:value-of select="$signout_title" /></h2>
            <a href="/"><xsl:value-of select="$back_to_main_page" /></a>
        </div>
    </xsl:template>

    <xsl:template match="page[@type='settings']">
        <xsl:param name="profileImage">
            <xsl:choose>
                <xsl:when test="profile/picture">/profileImage/<xsl:value-of select="profile/picture"/></xsl:when>
                <xsl:otherwise>/ui/img/anonymous.png</xsl:otherwise>
            </xsl:choose>
        </xsl:param>


        <div class="user-profile">
            <h2><xsl:value-of select="profile/display_name"/></h2>
            <img src="{$profileImage}" class="profile-image" />

            <xsl:if test="//user/user_id = profile/user_id">
                <form id="form_upload-profile-image" action="/profileImage" enctype="multipart/form-data" method="post" class="form_upload-profile-image">
                    <div class="form-buttons">
                        <input type="file" name="upload" multiple="multiple" required="required" pattern="xxx" />
                        <button id="button-update" type="submit"><xsl:value-of select="$btn_update_image" /></button>
                        <xsl:if test="profile/picture">
                            <a href="profileImage/remove" class="button btn_remove_image"><xsl:value-of select="$btn_remove_image"/></a>
                        </xsl:if>
                    </div>
                </form>
                <a href="/password" class="link-change-password"><xsl:value-of select="$link_change_password" /></a>
            </xsl:if>
        </div>
    </xsl:template>

    <xsl:template match="page[@type='approve-profile-image']">
        <form id="form_approve_profile_image" action="/profileImage/approve" method="post" class="page_form form_approve-profile-image">
            <h2><xsl:value-of select="$approve_profile_image" /></h2>
            <input type="hidden" name="referer" value="{referer}" />
            <input type="hidden" name="image" value="{image}" />
            <img src="/profileImage/temp-{image}" class="profile-image" />
            <div class="form-buttons">
                <button id="button-approve-profile-image" name="approve" type="submit" value="true"><xsl:value-of select="$btn_ok" /></button>
                <button id="button-reject-profile-image" name="reject" type="submit" value="true"><xsl:value-of select="$btn_cancel" /></button>
            </div>
        </form>
    </xsl:template>

    <xsl:template match="mail[@type='email-confirm']">
        <div class="theodorus-mail" style="direction:rtl;text-align:right;">
            <h1><img src="{data/server}/ui/img/theodorus_logo_small.png" title="{data/server}/ui/img/theodorus_logo_small.png" alt="{$app_name}" height="55" width="173"/></h1>
            <h1><img src="{data/server}/ui/img/theodorus_logo_small.png" alt="{$app_name}"/></h1>
            <div>
                <xsl:value-of select="$explain_email_confirmation_email" />
            </div>
            <a style="color: #105cb6;" href="{data/server}{data/link}"><xsl:value-of select="$btn_confirm_email" /></a>
        </div>
    </xsl:template>

    <xsl:template match="mail[@type='reset-password']">
        <div class="theodorus-mail" style="direction:rtl;text-align:right;">
            <h1><img src="{data/server}/ui/img/theodorus_logo_small.png" title="{data/server}/ui/img/theodorus_logo_small.png" alt="{$app_name}" height="55" width="173"/></h1>
            <div><xsl:value-of select="$explain_reset_password_email" /></div>
            <div><xsl:value-of select="$explain_reset_password_email_warning" /></div>
            <a style="color: #105cb6;" href="{data/server}{data/link}"><xsl:value-of select="$btn_reset_password" /></a>
        </div>
    </xsl:template>

</xsl:stylesheet>