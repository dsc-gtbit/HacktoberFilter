// -----JS CODE-----
var onSetDateFontSize = 350;
var dateIsVisible = false;
var initialized = false;
var sunglassesAvailable = true;
var birthdayHatAvailable = true;
var textResetTime = 4.0;
var burstProvider;
var logoAspect = 1.0;
var usableWidth = [0.1, 1.1];
var usableHeight = [0.1, 1.1];
var uvWidth = remap( script.spriteSize, 0, 1, usableWidth[0], usableWidth[1] );
var uvHeight = remap( script.spriteSize, 0, 1, usableHeight[0], usableHeight[1] );
var logoOffset = new vec2( 0, 0 );
var uvAspect = uvWidth / uvHeight;

if( script.extendedMode )
{
    var colorsSet = [ script.primaryHatColor,
        script.secondaryHatColor,
        script.tertiaryHatColor ];
}
else
{
    var colorsSet = [ script.primaryColor,
        script.secondaryColor,
        script.tertiaryColor ];
}

function initialize()
{
    if ( validateVariables() )
    {
        setCustomDateAndMessage();
        setProps();
        initialized = true;
        animationTrigger();
    }
}

function setCustomDateAndMessage()
{
    var remainingDays = calculateRemainingDays();

    if(remainingDays != 0)
    {
        script.messageText.text = script.customMessage;
        if(remainingDays == 1)
        {
            script.remainingDateText.text = remainingDays + " DAY";
        }
        else
        {
            script.remainingDateText.text = remainingDays + " DAYS";
        }
    }
    else
    {
        script.remainingDateText.text = script.setDateMessage;
        script.remainingDateText.size = onSetDateFontSize;
        script.messageText.enabled = false;
    }
}

function setProps()
{
    for( var i = 0; i < script.ringObjects.length; i++ )
    {
        var ringImage = script.ringObjects[i].getFirstComponent( "Component.Image" );
        ringImage.mainPass.baseColor = colorsSet[ i % colorsSet.length ];
    }

    for( var i = 0; i < script.hatMaterials.length; i++ )
    {
        script.hatMaterials[i].mainPass.baseColor = colorsSet[ i % colorsSet.length ];
    }

    if( script.extendedMode )
    {
        if( birthdayHatAvailable )
        {
            script.hatPom.mainMaterial.mainPass.baseColor = script.pomColor;
        }

        configureTransform({
            available: birthdayHatAvailable,
            object: script.hatAnchor,
            scale: script.hatSize,
            scaleMultiplier: 0.1,
            offset: script.hatOffset,
            offsetMultiplier: 5.0
        });

        if( sunglassesAvailable )
        {
            script.frameBackLayerMesh.mainMaterial.mainPass.baseColor = script.primaryFrameColor;
            script.frameTopLayerMesh.mainMaterial.mainPass.baseColor = script.secondaryFrameColor;
            script.lensMesh.mainMaterial.mainPass.baseColor = script.lensColor;
        }

        configureTransform({
            available: sunglassesAvailable,
            object: script.sunglassesAnchor,
            scale: script.frameSize,
            scaleMultiplier: 0.3,
            offset: script.frameOffset,
            offsetMultiplier: 5
        });
    }
    else
    {
        if( birthdayHatAvailable )
        {
            script.hatPom.mainMaterial.mainPass.baseColor = script.primaryColor;
        }
        if( sunglassesAvailable )
        {
            script.frameBackLayerMesh.mainMaterial.mainPass.baseColor = script.primaryColor;
            script.frameTopLayerMesh.mainMaterial.mainPass.baseColor = script.secondaryColor;
            script.lensMesh.mainMaterial.mainPass.baseColor = script.tertiaryColor;
        }
    }



    configureLensLogo();
}

function configureLensLogo()
{
    if( script.spriteTexture )
    {
        setEmissiveTexture( script.lensMesh.mainMaterial, script.spriteTexture, script.spriteIntensity );
        setTheLogoSize();
    }
}

function setTheLogoSize()
{
    var logoWidth = script.spriteTexture.getWidth();
    var logoHeight = script.spriteTexture.getHeight();

    logoAspect = logoWidth / logoHeight;

    var newScaleX = 1;
    var newScaleY = 1;

    if( logoAspect >= uvAspect )
    {
        newScaleX = 1 / uvWidth;
        newScaleY = 1 / ( uvWidth / logoAspect );
    }
    else
    {
        newScaleX = 1 / ( uvHeight * logoAspect );
        newScaleY = 1 / uvHeight;
    }

    var logoScale = new vec2( newScaleX * 0.5, newScaleY * 0.5 );
    var logoPlacement = new vec2( ( 1.0 - logoScale.x ) / 2, ( 1.0 - logoScale.y ) / 2);
    logoOffset = new vec2( -logoPlacement.x * logoOffset.x, logoPlacement.y * logoOffset.y );

    script.lensMesh.mainMaterial.mainPass.uv2Scale = logoScale;
    script.lensMesh.mainMaterial.mainPass.uv2Offset = logoPlacement.sub( logoOffset );
}

function animationTrigger()
{
    if( initialized )
    {
        animateBackgroundElements();

        if( !dateIsVisible )
        {
            animateText();
        }
    }
}

function animateBackgroundElements()
{
    for( var i = 0; i < script.ringObjects.length; i++ )
    {
        global.tweenManager.startTween( script.ringObjects[i], "PlayForward" );
    }

    var isAnimated = !!script.burstImage.mainPass.baseTex.control.getDuration;
    if( isAnimated )
    {
        burstProvider = script.burstImage.mainPass.baseTex.control;

        var loop = 3;
        var offset = 0;

        burstProvider.play( loop, offset );
    }
}

function animateText()
{
    global.tweenManager.startTween( script.dateTextAnchor, "PlayForward" );
    dateIsVisible = true;
    delayedAnimationResetEvent.reset( textResetTime );
}

function resetAnimatedText()
{
    global.tweenManager.startTween( script.dateTextAnchor, "PlayReverse" );
    dateIsVisible = false;
}

function calculateRemainingDays()
{
    var today = roundedDate( new Date() );

    var month = script.month;

    var yearWithLeapDay = 4;

    var day = Math.min(script.day, daysInMonth( month, yearWithLeapDay ) );

    var customUserDate = roundedDate( new Date() );

    customUserDate.setDate( day );
    customUserDate.setMonth( month - 1 );

    // Leap day
    if (month == 2 && day == 29) 
    {
        customUserDate = findNextLeapDay( today );
    }

    var daysRemaining = dateDiff( today, customUserDate );

    if( daysRemaining < 0 )
    {
        customUserDate.setFullYear( today.getFullYear() + 1 );
        daysRemaining = dateDiff( today, customUserDate );
    }

    return daysRemaining;
}

function dateDiff( current, inputDate )
{
    return Math.round( ( inputDate - current ) / ( 1000 * 60 * 60 * 24 ) );
}

// 1-index based month
function daysInMonth ( month, year )
{
    return new Date( year, month, 0 ).getDate();
}

// Is it a leap year?
function isLeapYear( year )
{
  return ( ( year % 4 == 0 ) && ( year % 100 != 0 ) ) || ( year % 400 == 0 );
}

function findNextLeapDay( startDate )
{
    var date = roundedDate( startDate );
    var year = date.getFullYear();
    if ( date.getMonth() > 1 )
    {
        year += 1;
    }
    while ( !isLeapYear( year ) )
    {
        year += 1;
    }
    date.setFullYear( year );
    date.setDate( 29 );
    date.setMonth( 1 );
    return date;
}

function roundedDate( date )
{
    var roundedDay = new Date();
    roundedDay.setFullYear( date.getFullYear() );
    roundedDay.setMonth( date.getMonth() );
    roundedDay.setDate( date.getDate() );
    roundedDay.setHours( 0 );
    roundedDay.setMinutes( 0 );
    roundedDay.setSeconds( 0 );
    roundedDay.setMilliseconds( 0 );
    return roundedDay;
}

function configureTransform( option )
{
    var scaleMultiplier = option.scale * option.scaleMultiplier;
    var offsetMultiplier = option.offset * option.offsetMultiplier;

    if( option.available )
    {
        var transform = option.object.getTransform();

        var ScaleTo = new vec3(
            transform.getLocalScale().x + scaleMultiplier,
            transform.getLocalScale().y + scaleMultiplier,
            transform.getLocalScale().z + scaleMultiplier
        );

        var OffsetTo = new vec3(
            transform.getLocalPosition().x,
            transform.getLocalPosition().y + offsetMultiplier,
            transform.getLocalPosition().z
        );
            
        transform.setLocalScale( ScaleTo );
        transform.setLocalPosition( OffsetTo );
    }
}

function validateVariables()
{
    if( !script.remainingDateText )
    {
        print( "CountdownController, ERROR: Please make sure Remaining Days object exist and assign Remaining Days object under the advanced checkbox." );
        return false;
    }

    if( !script.messageText )
    {
        print( "CountdownController, ERROR: Please make sure Message object exist and assign Message object under the advanced checkbox." );
        return false;
    }

    if( !script.burstImage )
    {
        print( "CountdownController, ERROR: Please make sure Animated Burst object exist and assign Animated Burst object under the advanced checkbox." );
        return false;
    }

    if( !script.frameTopLayerMesh )
    {
        print( "CountdownController, WARNING: Please make sure Frame Top Layer object exist and assign Frame Top Layer object under the advanced checkbox." );
        sunglassesAvailable = false;
    }

    if( !script.frameBackLayerMesh )
    {
        print( "CountdownController, WARNING: Please make sure Frame Back Layer object exist and assign Frame Back Layer object under the advanced checkbox." );
        sunglassesAvailable = false;
    }

    if( !script.lensMesh )
    {
        print( "CountdownController, WARNING: Please make sure Lens object exist and assign Lens object under the advanced checkbox." );
        sunglassesAvailable = false;
    }

    if( !script.hatPom )
    {
        print( "CountdownController, WARNING: Please make sure Pom object exist and assign Pom object under the advanced checkbox." );
        birthdayHatAvailable = false;
    }

    if( script.ringObjects.length == 0 )
    {
        print( "CountdownController, WARNING: Please make sure Ring objects exist and assign Ring objects under the advanced checkbox." );
    }
    else
    {
        for( var i = 0; i < script.ringObjects.length; i++ )
        {
            if( !script.ringObjects[i] )
            {
                print( "CountdownController, ERROR: Make sure values under ring objects is set and its not null." );
                return false;
            }
        }
    }

    if( script.hatMaterials.length == 0 )
    {
        print( "CountdownController, WARNING: Please make hat material exist in the Resources Panel and assign the materials under the advanced checkbox." );
    }
    else
    {
        for( var i = 0; i < script.hatMaterials.length; i++ )
        {
            if( !script.hatMaterials[i] )
            {
                print( "CountdownController, ERROR: Make sure values under hat materials is set and its not null." );
                return false;
            }
        }
    }

    if( !script.dateTextAnchor )
    {
        print( "CountdownController, ERROR: Please make sure Date Text Anchor object exist and assign Date Text Anchor object under the advanced checkbox." );
        return false;
    }

    return true;
}

function setEmissiveTexture( material, texture, intensity )
{
    material.mainPass.emissiveTex = texture;
    material.mainPass.emissiveIntensity = intensity;
}

function remap( value, low1, high1, low2, high2 ) 
{
    return low2 + ( high2 - low2 ) * ( value - low1 ) / ( high1 - low1 );
}

var delayedAnimationResetEvent = script.createEvent( "DelayedCallbackEvent" );
delayedAnimationResetEvent.bind( resetAnimatedText );

var onTriggerEvent = script.createEvent( script.animationTrigger );
onTriggerEvent.faceIndex = 0;
onTriggerEvent.bind( animationTrigger );

initialize();
