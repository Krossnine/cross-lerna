<?php

namespace Sample;

use PHPUnit\Framework\TestCase;

class BarTest extends TestCase
{
    public function testMayBeTrue()
    {
        $this->expectNotToPerformAssertions();
    }
}
