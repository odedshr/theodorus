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
                xmlns:exslt="http://exslt.org/common"><!-- keep xslt here. it's used by feed.xsl-->
    <xsl:include href="common.xsl" />
    <xsl:output method="html" encoding="UTF-8"/>

    <xsl:param name="language" select="'english'"/>
    <xsl:param name="variable" select="'#'"/>
    <xsl:param name="window_title" select="'Theodorus'"/>
    <xsl:param name="app_name" select="'Theodorus'"/>
    <xsl:param name="javascript_disabled_title" select="'Javascript is disabled in your browser'" />
    <xsl:param name="javascript_disabled_instructions" select="'Theodorus does not support browsers without Javascript'"/>
    <xsl:param name="text_intro" select="'A democratic forum to manage ideas and discussions. Anyone can suggest; Everyone can participate, find compromise and reach an agreements. Because this is how a community should behave.'" />
    <xsl:param name="system_loading" select="'Loading files, please wait'"/>
    <xsl:param name="previous_page" select="'Previous page'"/>

    <xsl:param name="page" select="'page'"/>
    <xsl:param name="out_of" select="'out of'"/>
    <xsl:param name="previous" select="'previous'"/>
    <xsl:param name="next" select="'next'"/>

    <xsl:param name="error_has_occoured" select="'an error has occoured'"/>
    <xsl:param name="error_unknown" select="'unknown error'"/>
    <xsl:variable name="errorMessages">
        <error type="page-not-found">requested page was not found</error>
        <error type="passwords-dont-match">the passwords do not match</error>
        <error type="password-too-short">the password is too short</error>
        <error type="password-too-simple">the password is too simple</error>
        <error type="terms-of-use-not-approved">the terms of use were not approved</error>
        <error type="uid-is-invalid">ID number is invalid</error>
        <error type="email-is-invalid">email address is invalid</error>
        <error type="email-in-use">this email address is already in use</error>
        <error type="name-too-short">name is too short</error>
        <error type="name-in-use">name is already in use</error>
        <error type="method-not-implemented">the methods is nto yet implemented</error>
        <error type="bad-credentials">bad credentials</error>
        <error type="no-permission">you have no permissions for this operation</error>
        <error type="no-input">this operation requires input</error>
        <result type="title-too-long">title too long</result>
        <result type="title-too-short">title too short</result>
        <result type="slug-too-short">slug is too short</result>
        <result type="slug-is-invalid">slug is invalid</result>
        <result type="slug-not-available">slug is not available</result>
        <result type="comment-too-long">comment is too long</result>
        <result type="comment-too-short">comment is too short</result>
        <error type="item-not-found">item was not found</error>
        <error type="topic-not-found">topic was not found</error>
        <error type="comment-not-found">comment was not found</error>
        <error type="image-process-failed">image-processing failed</error>
        <error type="user-already-activated">user is already activated. not need in email confirmation</error>
        <error type="email-confirmation-invalid">email confirmation failed due to invalid confirmation code</error>
        <error type="email-is-unknown">this email is unknown</error>
        <error type="old-password-is-wrong">old password is invalid</error>
        <error type="system-error">system error</error>
        <error type="unknown_error">unknown error</error>
    </xsl:variable>

    <xsl:variable name="infoMessages">
        <error type="authenticating">authenticating...</error>
        <error type="sending-data">sending data...</error>
        <error type="reset-email-sent">Instructions on resetting your password were sent to your email</error>
        <error type="password-changed">password updated</error>
    </xsl:variable>

    <xsl:variable name="timestamps">
        <timeLabel id="just-now">just now</timeLabel>
        <timeLabel id="a-minute-ago">a minute ago</timeLabel>
        <timeLabel id="two-minutes-ago">two minutes ago</timeLabel>
        <timeLabel id="#-minutes-ago"># minutes ago</timeLabel>
        <timeLabel id="quarter-of-an-hour-ago">fifteen minutes ago</timeLabel>
        <timeLabel id="half-an-hour-ago">half an hour ago</timeLabel>
        <timeLabel id="an-hour-ago">an hour ago</timeLabel>
        <timeLabel id="two-hours-ago">two hours ago</timeLabel>
        <timeLabel id="#-hours-ago"># hours ago</timeLabel>
        <timeLabel id="yesterday">yesterday</timeLabel>
        <timeLabel id="two-days-ago">the day before last</timeLabel>
        <timeLabel id="#-days-ago"># days agp</timeLabel>
        <timeLabel id="a-week-ago">a week ago</timeLabel>
        <timeLabel id="two-weeks-ago">two weeks ago</timeLabel>
        <timeLabel id="#-weeks-ago"># weeks ago</timeLabel>
    </xsl:variable>

    <xsl:param name="title_signin" select="'Theodorus: sign-in'"/>
    <xsl:param name="title_signup" select="'Theodorus: sign-up'"/>
    <xsl:param name="explain_confirm_email">
        <span>At the end of the short registration process to Thedorus you'll be able to take an active part in the community and participate in the democratic process</span>
        <span>First, please confirm your email address:</span>
    </xsl:param>
    <xsl:param name="btn_confirm_email" select="'לאימות הדואל, לחצו כאן'"/>
    <xsl:param name="explain_email_confirmation_email">Got the email? Great! now you just need to finish the sign-up process and start contributing to your community</xsl:param>

    <xsl:param name="lbl_confirm_email_sent" select="'a confimration email was sent to your email address!'"/>
    <xsl:param name="explain_confirm_email_check_email" select="'To proceed, please click the link in the confirmation mail'"/>
    <xsl:param name="explain_confirm_email_check_spam" select="'No mail? could it be that it ended in your spam folder?'"/>


    <xsl:param name="title_forgotPassword" select="'forgot your password?'"/>
    <xsl:param name="explain_forgot_password">
        <span>Don't worry, it happens to everyone. To get a password-reset link by mail, please enter your email address -</span>
    </xsl:param>

    <xsl:param name="btn_send_link" select="'Send link'"/>
    <xsl:param name="explain_reset_password_email">Got the mail? Great! Now you just need to set a new password</xsl:param>
    <xsl:param name="explain_reset_password_email_warning">If you didn't ask for a password reset, maybe some else entered your email address. It might be wise to reset your password anyhow</xsl:param>

    <xsl:param name="link_change_password" select="'change password'"/>
    <xsl:param name="btn_reset_password" select="'to reset your password, click here'"/>
    <xsl:param name="title_change_password" select="'Password Update'"/>
    <xsl:param name="btn_update_password" select="'udpate password'"/>

    <xsl:param name="lbl_name" select="'name (or alias)'"/>
    <xsl:param name="lbl_name_example" select="'e.g.: John_Doe'"/>
    <xsl:param name="lbl_email" select="'Full email address'"/>
    <xsl:param name="lbl_email_example" select="'e.g.: israel@gmail.com'"/>
    <xsl:param name="lbl_current_password" select="'current password'"/>
    <xsl:param name="lbl_password" select="'password'"/>
    <xsl:param name="lbl_repeat_password" select="'repeat password'"/>
    <xsl:param name="lbl_forgot_password" select="'forgot password?'"/>
    <xsl:param name="lbl_terms_of_use" select="'I confirm that I have read and the I am willing to act by the terms of use'"/>
    <xsl:param name="lbl_remember_me" select="'remember me'"/>
    <xsl:param name="password_security_instructions">
        <ul>
            <h3>How to choose a secured password</h3>
            <li>
                <h4>Unsecured password</h4>
                <ul>
                    <li class="note">at least 3 characters</li>
                    <li class="note">all characters of the same type (digits, lower-case,...)</li>
                    <li class="note">e.g. “easy”,”8892″,”NOTSECURE”</li>
                </ul>
            </li>
            <li>
                <h4>Reasonable password</h4>
                <ul>
                    <li class="note">at least 6 characters</li>
                    <li class="note">a mix of characters and digits</li>
                    <li class="note">e.g. “common1″,”7etmein”</li>
                </ul>
            </li>
            <li>
                <h4>Secured password</h4>
                <ul>
                    <li class="note">at least 8 characters</li>
                    <li class="note">a mix of characters, digit and special characters</li>
                    <li class="note">e.g. : “15NotE@sy”,”Bett.er-Yet”</li>
                </ul>
            </li>
            <li>
                <h4>Super-secured password</h4>
                <ul>
                    <li class="note">at least 8 characters</li>
                    <li class="note">a mix of all possible type</li>
                    <li class="note">e.g: ”o0Q!i9W@e3”</li>
                </ul>
            </li>
        </ul>
    </xsl:param>
    <xsl:param name="terms_of_use">
        <ol>
            <li class="note">No promotion of violence of any sort</li>
            <li class="note">No irrelevant soliciting</li>
            <li class="note">No copyright infringement</li>
            <li class="note">The user is the sole responsible for his content</li>
        </ol>
    </xsl:param>

    <xsl:param name="signout_title" select="'see you soon!'"/>
    <xsl:param name="btn_signout" select="'Sign Out'"/>
    <xsl:param name="btn_signin" select="'Sign In'"/>
    <xsl:param name="btn_signup" select="'Sign Up'"/>
    <xsl:param name="btn_submit_signin" select="'OK'"/>
    <xsl:param name="btn_submit_signup" select="'OK'"/>
    <xsl:param name="btn_ok" select="'OK'"/>
    <xsl:param name="btn_cancel" select="'cancel'"/>
    <xsl:param name="welcome" select="'Welcome'"/>
    <xsl:param name="almost_completed" select="'almsot completed...'"/>
    <xsl:param name="welcome_back" select="'welcome back!'"/>
    <xsl:param name="nav_blog" select="'project blog'"/>
    <xsl:param name="nav_features" select="'features'"/>
    <xsl:param name="nav_sourcecode" select="'sourcecode'"/>
    <xsl:param name="nav_donations" select="'donations'"/>
    <xsl:param name="link_to_main_page" select="'main page'"/>
    <xsl:param name="back_to_main_page" select="'back to main page'"/>
    <xsl:param name="back_to_main_list" select="'back to main list'"/>

    <xsl:param name="lbl_topic_title" select="'title'"/>
    <xsl:param name="example_topic_title">e.g. every citizen should be allowed to suggest laws and popular suggestions will become drafts that later will be come law</xsl:param>
    <xsl:param name="characters_left" select="'characters left'"/>
    <xsl:param name="lbl_topic_slug" select="'slug'"/>
    <xsl:param name="example_topic_title_slug" select="'democracy-for-everyone'"/>
    <xsl:variable name="slugResults">
        <result type="slug-too-short">slug too short</result>
        <result type="slug-is-invalid">slug is invalid</result>
        <result type="slug-not-available">slug not available</result>
        <result type="slug-is-available">slug is available</result>
    </xsl:variable>

    <xsl:param name="lbl_topic_feedback" select="'feedback'"/>
    <xsl:param name="link_suggest_topic" select="'suggest topic'"/>
    <xsl:param name="btn_remove" select="'remvoe'"/>
    <xsl:param name="stat_endorse" select="'endorsments'"/>
    <xsl:param name="btn_endorse" select="'endorse'"/>
    <xsl:param name="stat_follow" select="'followers'"/>
    <xsl:param name="btn_follow" select="'follow'"/>
    <xsl:param name="stat_report" select="'reports'"/>
    <xsl:param name="btn_report" select="'this is inappropriate!'"/>
    <xsl:param name="stat_comment" select="'comments'"/>
    <xsl:param name="btn_comment" select="'comment'"/>
    <xsl:param name="stat_opinion" select="'opinions'"/>
    <xsl:param name="btn_opinion" select="'add your opinion'"/>

    <xsl:param name="showing_x_items" select="'showing # items'" />
    <xsl:param name="showing_items_related_to_x" select="'showing items about #'" />
    <xsl:param name="lbl_no_topics_found" select="'no items found!'"/>
    <xsl:param name="lbl_no_topics_found_suggest_one" select="'you should suggest one noe'"/>
    <xsl:param name="file_not_found_title" select="'file not found'"/>
    <xsl:param name="file_not_found-what_to_do">
        <p>We're sorry, but the item you were asking for doesn't exist</p>
        <ul>
            <li class="note">maybe you have typo?</li>
            <li class="note">perhaps the link wasn't updated?</li>
        </ul>
        <p>back to<a href="/">main page</a></p>
    </xsl:param>

    <xsl:param name="failed_to_load_topic" select="'failed to load item'"/>
    <xsl:param name="back" select="'back'"/>
    <xsl:param name="opinions" select="'opinions'"/>
    <xsl:param name="your_opinion" select="'your opinion'"/>
    <xsl:param name="other_opinions" select="'other opinions'"/>
    <xsl:param name="no_other_opinions" select="'no other opinions'"/>
    <xsl:param name="no_opinions" select="'no opinions at this time'"/>
    <xsl:param name="add_comment" select="'add comment'"/>
    <xsl:param name="update_comment" select="'update comment'"/>
    <xsl:param name="btn_add_comment" select="'add comment'"/>
    <xsl:param name="btn_update_comment" select="'update comment'"/>
    <xsl:param name="tweet" select="'tweet'"/>


    <xsl:param name="lbl_topic_tags" select="'tags'"/>
    <xsl:param name="example_topic_tags" select="'e.g environmental'"/>
    <xsl:param name="btn_suggest" select="'add'"/>
    <xsl:param name="lbl_tags" select="'tags'"/>
    <xsl:param name="lbl_tags_placeholder" select="'tags are comma seperated, no need to add hashtag'"/>
    <xsl:param name="lbl_tags_instructions" select="'add and support existing tags to help other find this topic'"/>
    <xsl:param name="btn_update_tags" select="'update tags'"/>


    <xsl:param name="btn_update_image" select="'update image'"/>
    <xsl:param name="btn_remove_image" select="'remove image'"/>
    <xsl:param name="approve_profile_image" select="'please confirm the profile image'"/>

    <xsl:param name="logged_action_server" select="'server'"/>
    <xsl:param name="logged_action_type" select="'type'"/>
    <xsl:param name="logged_action_content" select="'content'"/>

    <xsl:variable name="mailSubjects">
        <label key="email-confirm">Welcome to Theodorus</label>
        <label key="invite-to-app">Invitation to Theodorus</label>
        <label key="logged-action">Theodorus: logged action</label>
        <label key="reset-password">Thedorus: reset password</label>
        <label key="invite-to-topic">Invitation to discussion about #</label>
        <label key="daily-report">Theodorus: daily report</label>
    </xsl:variable>

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>
</xsl:stylesheet>